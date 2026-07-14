'use client';
import React, { useState, useEffect } from 'react';
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
import { StatCard } from '@/components/ui/stat-card';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import { Search, Plus, RefreshCw, Users, Shield, Mail, Phone, Building2 } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  branchId?: string;
  branchName?: string;
  tenantId: string;
  tenantName?: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const { addToast } = useToastStore();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      const result = await adminApi.request('/admin/staff', { params });
      setStaff(result.data || []);
      setTotal(result.total || (result.data || []).length);
    } catch (err: any) {
      addToast(err.message || 'Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, [page, search, roleFilter]);

  const columns = [
    {
      key: 'name',
      header: 'Staff Member',
      sortable: true,
      render: (_: any, row: StaffMember) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink text-canvas flex items-center justify-center text-[11px] font-bold shrink-0">
            {getInitials(row.name)}
          </div>
          <div>
            <p className="font-sans font-semibold text-sm">{row.name}</p>
            <p className="text-caption text-body font-sans">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (_: any, row: StaffMember) => <StatusBadge status={row.role} />,
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (_: any, row: StaffMember) => (
        <span className="text-body-sm font-sans">{row.branchName || '—'}</span>
      ),
    },
    {
      key: 'tenant',
      header: 'Restaurant',
      render: (_: any, row: StaffMember) => (
        <span className="text-body-sm font-sans">{row.tenantName || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: StaffMember) => <StatusBadge status={row.status || 'active'} />,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (_: any, row: StaffMember) => (
        <span className="text-body-sm font-sans text-body">{row.lastLogin ? formatDate(row.lastLogin) : 'Never'}</span>
      ),
    },
  ];

  const roleCounts = {
    total: staff.length,
    admins: staff.filter(s => s.role === 'ADMIN').length,
    managers: staff.filter(s => s.role === 'MANAGER').length,
    servers: staff.filter(s => s.role === 'SERVER').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Team"
        title="Staff Management"
        description="Manage staff across all restaurants on the platform"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchStaff}><RefreshCw size={14} /> Refresh</Button>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Add Staff</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Staff" value={roleCounts.total} />
        <StatCard label="Admins" value={roleCounts.admins} />
        <StatCard label="Managers" value={roleCounts.managers} />
        <StatCard label="Servers" value={roleCounts.servers} />
      </div>

      <div className="divider-heavy" />

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'SERVER', label: 'Server' },
              { value: 'KITCHEN', label: 'Kitchen' },
              { value: 'CASHIER', label: 'Cashier' },
            ]}
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : staff.length === 0 ? (
        <EmptyState
          icon={<Users size={48} strokeWidth={1} />}
          title="No staff members found"
          description={search || roleFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Staff members will appear here once added by restaurant owners.'}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={staff}
            onRowClick={(row) => { setSelectedStaff(row); setShowDetail(true); }}
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

      <Dialog open={showDetail} onClose={() => setShowDetail(false)} title={selectedStaff?.name || 'Staff Details'} size="lg">
        {selectedStaff && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-ink text-canvas flex items-center justify-center text-lg font-bold shrink-0">
                {getInitials(selectedStaff.name)}
              </div>
              <div>
                <h3 className="text-display-xs font-sans">{selectedStaff.name}</h3>
                <p className="text-body-sm text-body font-sans">{selectedStaff.email}</p>
              </div>
            </div>
            <div className="h-[2px] bg-hairline" />
            <div className="grid grid-cols-2 gap-4">
              <div><p className="label">Role</p><StatusBadge status={selectedStaff.role} /></div>
              <div><p className="label">Status</p><StatusBadge status={selectedStaff.status || 'active'} /></div>
              <div><p className="label">Branch</p><p className="text-body-sm font-sans">{selectedStaff.branchName || '—'}</p></div>
              <div><p className="label">Restaurant</p><p className="text-body-sm font-sans">{selectedStaff.tenantName || '—'}</p></div>
              <div><p className="label">Phone</p><p className="text-body-sm font-sans">{selectedStaff.phone || '—'}</p></div>
              <div><p className="label">Last Login</p><p className="text-body-sm font-sans">{selectedStaff.lastLogin ? formatDate(selectedStaff.lastLogin) : 'Never'}</p></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
              <Button>Edit Staff</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Add Staff Member" size="lg">
        <StaffForm onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchStaff(); }} />
      </Dialog>
    </div>
  );
}

function StaffForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'SERVER', tenantId: '', branchId: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.request('/admin/staff', { method: 'POST', body: JSON.stringify(form) });
      addToast('Staff member added', 'success');
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Failed to add staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          options={[
            { value: 'ADMIN', label: 'Admin' },
            { value: 'MANAGER', label: 'Manager' },
            { value: 'SERVER', label: 'Server' },
            { value: 'KITCHEN', label: 'Kitchen' },
            { value: 'CASHIER', label: 'Cashier' },
          ]}
        />
        <Input label="Restaurant ID" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} placeholder="UUID" />
        <Input label="Branch ID" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} placeholder="UUID (optional)" />
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={loading}>Add Staff</Button>
      </DialogFooter>
    </form>
  );
}
