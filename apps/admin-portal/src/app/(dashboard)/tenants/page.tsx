'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { DataTable, Pagination } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import {
  Search, Plus, Download, Filter, Building2, Eye, Edit, Trash2,
  MoreVertical, ArrowUpDown, ChevronDown, RefreshCw, Mail, Phone, MapPin
} from 'lucide-react';
import type { Tenant } from '@/types';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { addToast } = useToastStore();

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (planFilter !== 'all') params.plan = planFilter;
      const result = await adminApi.listTenants(params);
      setTenants(result.data || result);
      setTotal(result.total || (result.data || result).length);
    } catch (err: any) {
      addToast(err.message || 'Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter]);

  React.useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const columns = [
    {
      key: 'name',
      header: 'Restaurant',
      sortable: true,
      render: (_: any, row: Tenant) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink text-canvas flex items-center justify-center text-[11px] font-bold shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-sans font-semibold text-sm">{row.name}</p>
            <p className="text-caption text-body font-sans">{row.slug || row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (_: any, row: Tenant) => (
        <span className="text-body-sm font-sans">{row.ownerName || row.owner?.name || '—'}</span>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (_: any, row: Tenant) => (
        <StatusBadge status={row.plan || row.subscription?.plan || 'trial'} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: Tenant) => (
        <StatusBadge status={row.status || 'active'} />
      ),
    },
    {
      key: 'city',
      header: 'Location',
      render: (_: any, row: Tenant) => (
        <span className="text-body-sm font-sans">{row.city || '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (_: any, row: Tenant) => (
        <span className="text-body-sm font-sans text-body">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (_: any, row: Tenant) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedTenant(row); setShowDetail(true); }}
            className="btn-ghost btn-sm p-1.5"
            title="View"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedTenant(row); setShowDetail(true); }}
            className="btn-ghost btn-sm p-1.5"
            title="Edit"
          >
            <Edit size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Tenants"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchTenants}>
              <RefreshCw size={14} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download size={14} />
              Export
            </Button>
            <Link href="/provision" className="btn btn-primary btn-sm">
              <Plus size={14} />
              Create Restaurant
            </Link>
          </>
        }
      />

      <div className="divider-heavy" />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              type="text"
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
          <div className="flex gap-3">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            />
            <Select
              options={[
                { value: 'all', label: 'All Plans' },
                { value: 'trial', label: 'Trial' },
                { value: 'starter', label: 'Starter' },
                { value: 'professional', label: 'Professional' },
                { value: 'enterprise', label: 'Enterprise' },
              ]}
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1} />}
          title="No tenants found"
          description={search || statusFilter !== 'all' || planFilter !== 'all'
            ? 'Try adjusting your search or filters.'
            : 'Get started by adding your first tenant.'}
          action={!search && statusFilter === 'all' && planFilter === 'all'
            ? { label: 'Add Tenant', onClick: () => setShowCreate(true) }
            : undefined}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={tenants}
            onRowClick={(row) => { setSelectedTenant(row); setShowDetail(true); }}
            keyExtractor={(row) => row.id}
          />
          <Pagination
            page={page}
            totalPages={Math.ceil(total / 10)}
            onPageChange={setPage}
            total={total}
            pageSize={10}
          />
        </>
      )}

      {/* Tenant Detail Dialog */}
      <Dialog open={showDetail} onClose={() => setShowDetail(false)} title={selectedTenant?.name || 'Tenant Details'} size="lg">
        {selectedTenant && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-ink text-canvas flex items-center justify-center text-lg font-bold shrink-0">
                {getInitials(selectedTenant.name)}
              </div>
              <div>
                <h3 className="text-display-xs font-sans">{selectedTenant.name}</h3>
                <p className="text-body-sm text-body font-sans">{selectedTenant.email}</p>
              </div>
            </div>

            <div className="h-[2px] bg-hairline" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="label">Owner</p>
                <p className="text-body-sm font-sans">{selectedTenant.ownerName || selectedTenant.owner?.name || '—'}</p>
              </div>
              <div>
                <p className="label">Plan</p>
                <StatusBadge status={selectedTenant.plan || selectedTenant.subscription?.plan || 'trial'} />
              </div>
              <div>
                <p className="label">Status</p>
                <StatusBadge status={selectedTenant.status || 'active'} />
              </div>
              <div>
                <p className="label">City</p>
                <p className="text-body-sm font-sans">{selectedTenant.city || '—'}</p>
              </div>
              <div>
                <p className="label">Phone</p>
                <p className="text-body-sm font-sans">{selectedTenant.phone || '—'}</p>
              </div>
              <div>
                <p className="label">Created</p>
                <p className="text-body-sm font-sans">{formatDate(selectedTenant.createdAt)}</p>
              </div>
            </div>

            {selectedTenant.address && (
              <div>
                <p className="label">Address</p>
                <p className="text-body-sm font-sans">{selectedTenant.address}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
              <Button>Edit Tenant</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Add New Tenant" size="lg">
        <TenantForm onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchTenants(); }} />
      </Dialog>
    </div>
  );
}

function TenantForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', state: '', address: '', businessType: 'restaurant',
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.createTenant(form);
      addToast('Tenant created successfully', 'success');
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Failed to create tenant', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Restaurant Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        <Select
          label="Business Type"
          value={form.businessType}
          onChange={(e) => setForm({ ...form, businessType: e.target.value })}
          options={[
            { value: 'restaurant', label: 'Restaurant' },
            { value: 'cafe', label: 'Café' },
            { value: 'cloud_kitchen', label: 'Cloud Kitchen' },
            { value: 'food_truck', label: 'Food Truck' },
            { value: 'bakery', label: 'Bakery' },
          ]}
        />
      </div>
      <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={loading}>Create Tenant</Button>
      </DialogFooter>
    </form>
  );
}
