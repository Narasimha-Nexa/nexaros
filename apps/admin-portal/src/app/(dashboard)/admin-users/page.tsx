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
import { formatDate } from '@/lib/utils';
import { Search, Plus } from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

const columns = [
  { key: 'name', header: 'Name', render: (_: any, u: AdminUser) => (
    <div>
      <div className="text-body-sm font-sans font-semibold">{u.name}</div>
      <div className="text-caption font-sans text-body">{u.email}</div>
    </div>
  ) },
  { key: 'role', header: 'Role', render: (_: any, u: AdminUser) => <span className="text-body-sm font-sans">{u.role}</span> },
  { key: 'mfa', header: 'MFA', render: (_: any, u: AdminUser) => u.mfaEnabled ? <StatusBadge status="success" label="Enabled" /> : <StatusBadge status="inactive" label="Disabled" /> },
  { key: 'lastLogin', header: 'Last Login', render: (_: any, u: AdminUser) => <span className="text-body-sm font-sans text-body">{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</span> },
  { key: 'status', header: 'Status', render: (_: any, u: AdminUser) => <StatusBadge status={u.isActive ? 'success' : 'inactive'} label={u.isActive ? 'Active' : 'Disabled'} /> },
  { key: 'createdAt', header: 'Created', render: (_: any, u: AdminUser) => <span className="text-body-sm font-sans text-body">{formatDate(u.createdAt)}</span> },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' });
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { fetchUsers(); }, [page, debouncedSearch]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAdminUsers(debouncedSearch, page, PAGE_SIZE) as { users: AdminUser[]; total: number };
      setUsers(res.users);
      setTotal(res.total);
    } catch (err: any) {
      addToast(err.message || 'Failed to load admin users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      addToast('All fields are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminApi.createAdminUser(form);
      addToast('Admin user created', 'success');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'ADMIN' });
      fetchUsers();
    } catch (err: any) {
      addToast(err.message || 'Failed to create admin user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: 'Total Admins', value: total.toString() },
    { label: 'Active', value: users.filter(u => u.isActive).length.toString() },
    { label: 'MFA Enabled', value: users.filter(u => u.mfaEnabled).length.toString() },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Users" description="Manage platform administrator accounts" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-body" size={16} />
            <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setShowCreate(true)}><Plus size={16} className="mr-1" /> Add Admin</Button>
        </div>

        {loading ? (
          <TableSkeleton rows={PAGE_SIZE} cols={columns.length} />
        ) : users.length === 0 ? (
          <EmptyState title="No admin users found" description="Create your first admin account." />
        ) : (
          <DataTable columns={columns} data={users} />
        )}

        {!loading && total > PAGE_SIZE && (
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </Card>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Add Admin User">
        <div className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Temporary Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'SUPER_ADMIN', label: 'Super Admin' }]} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={saving}>Create Admin</Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
