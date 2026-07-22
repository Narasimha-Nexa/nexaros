'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { ChevronLeft, ChevronRight, Globe } from 'lucide-react';

const PAGE_SIZE = 20;

export default function WebsiteTenantPicker() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const q = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminApi.listTenants({ search, limit: String(PAGE_SIZE), page: String(page) });
        setTenants(res?.data || []);
        setTotal(res?.meta?.total || res?.total || (res?.data?.length ?? 0));
      } catch (e: any) {
        addToast(e.message || 'Failed to load tenants', 'error');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(q);
  }, [search, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader title="Website Management" description="Select a restaurant to manage its customer-facing website" />
      <Input
        placeholder="Search restaurants by name or slug..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-body">Loading restaurants...</p>
        ) : tenants.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Globe size={48} className="mx-auto text-ink/20 mb-3" />
            <p className="text-body">No restaurants found.</p>
          </div>
        ) : (
          tenants.map((t) => (
            <Card key={t.id} className="p-4 hover:border-primary transition-colors cursor-pointer"
              onClick={() => router.push(`/website/${t.id}`)}>
              <div className="flex items-center gap-3">
                {t.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.logo} alt={t.name} className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {(t.name || '?').charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-ink truncate">{t.name}</p>
                  <p className="text-xs text-body truncate">/{t.slug}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full"
                onClick={(e) => { e.stopPropagation(); router.push(`/website/${t.id}`); }}>
                Manage Website
              </Button>
            </Card>
          ))
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-body">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
