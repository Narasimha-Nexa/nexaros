'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';

export default function WebsiteTenantPicker() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [search, setSearch] = useState('');
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = setTimeout(async () => {
      try {
        const res = await adminApi.listTenants({ search, limit: '50', page: '1' });
        setTenants(res?.data || []);
      } catch (e: any) {
        addToast(e.message || 'Failed to load tenants', 'error');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(q);
  }, [search]);

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
          <p className="text-body">No restaurants found.</p>
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
    </div>
  );
}
