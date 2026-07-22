'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useToastStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { cn, formatDate, downloadCSV, getInitials } from '@/lib/utils';
import type { Tenant, TenantStats } from '@/types';
import {
  Building2, Search, Plus, RefreshCw, Download, Filter, MoreHorizontal,
  Eye, Edit, Trash2, Pause, Play, LogIn, ChevronDown, X, Check,
  Users, GitBranch, ShoppingCart, ArrowUpDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ExternalLink, Copy, Loader2,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'createdAt_asc', label: 'Oldest' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'name_asc', label: 'Name Z-A' },
  { value: 'city', label: 'City' },
  { value: 'updatedAt', label: 'Recently Updated' },
];

export default function TenantsPage() {
  const router = useRouter();
  const { startImpersonation } = useAuthStore();
  const { addToast } = useToastStore();
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [viewTenant, setViewTenant] = useState<Tenant | null>(null);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [deleteTenant, setDeleteTenant] = useState<Tenant | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, planFilter, countryFilter, sortBy, sortDir]);

  const queryParams: Record<string, string> = {
    page: String(page),
    limit: String(limit),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter && { status: statusFilter }),
    ...(planFilter && { plan: planFilter }),
    ...(countryFilter && { country: countryFilter }),
    ...(sortBy && { sortBy }),
    ...(sortDir && { sortDir }),
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tenants', queryParams],
    queryFn: () => adminApi.listTenants(queryParams),
    placeholderData: (prev) => prev,
  });

  const { data: stats } = useQuery<TenantStats>({
    queryKey: ['tenant-stats'],
    queryFn: () => adminApi.getTenantStats(),
  });

  const tenants: Tenant[] = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 };

  const handleSelectAll = () => {
    if (selectedIds.size === tenants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tenants.map((t) => t.id)));
    }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (action: string) => {
    if (!selectedIds.size) return;
    try {
      await adminApi.bulkTenantAction(Array.from(selectedIds), action);
      addToast(`${selectedIds.size} tenant(s) ${action}ed`, 'success');
      setSelectedIds(new Set());
      refetch();
    } catch (err: any) {
      addToast(err.message || 'Bulk action failed', 'error');
    }
  };

  const handleStatusToggle = async (tenant: Tenant) => {
    try {
      await adminApi.updateTenantStatus(tenant.id, tenant.isActive ? 'inactive' : 'active');
      addToast(`Tenant ${tenant.isActive ? 'suspended' : 'activated'}`, 'success');
      refetch();
    } catch (err: any) {
      addToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTenant || deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteTenant(deleteTenant.id);
      addToast(`${deleteTenant.name} permanently deleted`, 'success');
      setDeleteTenant(null);
      setDeleteConfirm('');
      refetch();
    } catch (err: any) {
      addToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImpersonate = async (tenant: Tenant) => {
    if (!tenant.owner?.id) {
      addToast('No owner found for this tenant', 'error');
      return;
    }
    try {
      await startImpersonation(tenant.id, tenant.owner.id);
      addToast(`Impersonating ${tenant.name}`, 'success');
      if (tenant.subdomain) {
        window.open(`https://${tenant.subdomain}.nexaros.in`, '_blank');
      } else {
        router.push(`/tenants/${tenant.id}`);
      }
    } catch (err: any) {
      addToast(err.message || 'Impersonation failed', 'error');
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params: Record<string, string> = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.plan = planFilter;

      if (format === 'json') {
        const result = await adminApi.exportTenants('json', params);
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'tenants.json'; a.click();
        URL.revokeObjectURL(url);
      } else {
        const result = await adminApi.exportTenants('csv', params);
        const blob = new Blob([result as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'tenants.csv'; a.click();
        URL.revokeObjectURL(url);
      }
      setShowExportMenu(false);
      addToast(`Exported as ${format.toUpperCase()}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Export failed', 'error');
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const getSubscriptionBadge = (t: Tenant) => {
    if (!t.subscription) return <Badge variant="outline">No Plan</Badge>;
    const s = t.subscription;
    if (s.status === 'TRIAL') {
      const daysLeft = s.trialEndsAt ? Math.ceil((new Date(s.trialEndsAt).getTime() - Date.now()) / 86400000) : 0;
      return <Badge variant="outline">{daysLeft > 0 ? `${daysLeft}d trial` : 'Trial expired'}</Badge>;
    }
    return <Badge variant="filled">{s.plan}</Badge>;
  };

  const totalPages = pagination.pages;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Tenants"
        description="Manage all restaurant businesses on the platform"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw size={14} /> Refresh</Button>
            <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setShowExportMenu(!showExportMenu)}><Download size={14} /> Export</Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-canvas border border-hairline shadow-lg w-36">
                  <button onClick={() => handleExport('csv')} className="w-full text-left px-3 py-2 text-body-sm font-sans hover:bg-ink hover:text-canvas transition-colors">CSV</button>
                  <button onClick={() => handleExport('json')} className="w-full text-left px-3 py-2 text-body-sm font-sans hover:bg-ink hover:text-canvas transition-colors">JSON</button>
                </div>
              )}
            </div>
            <Button size="sm" onClick={() => router.push('/provision')}><Plus size={14} /> Create Restaurant</Button>
          </>
        }
      />
      <div className="divider-heavy" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Tenants" value={stats.totalTenants} />
          <StatCard label="Active" value={stats.activeTenants} changeType="positive" change={`${stats.inactiveTenants} inactive`} />
          <StatCard label="Trial" value={stats.trialTenants} />
          <StatCard label="Paid" value={stats.paidTenants} />
          <StatCard label="This Month" value={stats.createdThisMonth} change={`${stats.createdToday} today`} />
          <StatCard label="Total Users" value={stats.totalUsers} change={`${stats.totalBranches} branches`} />
        </div>
      )}

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by name, email, phone, city, GST, subdomain, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 border-2 border-ink bg-canvas text-body font-sans focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-ink">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border-2 border-ink bg-canvas text-body-sm font-sans cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-10 px-3 border-2 border-ink bg-canvas text-body-sm font-sans cursor-pointer"
          >
            <option value="">All Plans</option>
            <option value="starter-free">Starter Free</option>
            <option value="professional">Professional</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={`${sortBy}${sortDir === 'asc' ? '_asc' : ''}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val.endsWith('_asc')) { setSortBy(val.replace('_asc', '')); setSortDir('asc'); }
              else { setSortBy(val); setSortDir('desc'); }
            }}
            className="h-10 px-3 border-2 border-ink bg-canvas text-body-sm font-sans cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-ink text-canvas">
          <span className="text-caption font-sans">{selectedIds.size} selected</span>
          <Button size="sm" variant="ghost" onClick={() => handleBulkAction('activate')} className="text-canvas hover:bg-canvas/20">Activate</Button>
          <Button size="sm" variant="ghost" onClick={() => handleBulkAction('suspend')} className="text-canvas hover:bg-canvas/20">Suspend</Button>
          <Button size="sm" variant="ghost" onClick={() => setBulkDeleteConfirm(true)} className="text-canvas hover:bg-canvas/20 text-danger">Delete</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="ml-auto text-canvas hover:bg-canvas/20">
            <X size={14} /> Clear
          </Button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : tenants.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={<Building2 size={48} strokeWidth={1} />}
            title="No tenants found"
            description={debouncedSearch || statusFilter || planFilter
              ? 'Try adjusting your search or filters'
              : 'Create your first restaurant to get started'}
            action={!debouncedSearch && !statusFilter && !planFilter
              ? { label: 'Create Restaurant', onClick: () => router.push('/provision') }
              : undefined}
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-ink bg-canvas-soft">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === tenants.length && tenants.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 accent-ink cursor-pointer"
                    />
                  </th>
                  <th className="p-3 text-caption font-sans font-bold tracking-wider uppercase text-body">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-ink">
                      Restaurant <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="p-3 text-caption font-sans font-bold tracking-wider uppercase text-body hidden md:table-cell">Owner</th>
                  <th className="p-3 text-caption font-sans font-bold tracking-wider uppercase text-body hidden lg:table-cell">Plan</th>
                  <th className="p-3 text-caption font-sans font-bold tracking-wider uppercase text-body">Status</th>
                  <th className="p-3 text-caption font-sans font-bold tracking-wider uppercase text-body hidden lg:table-cell">
                    <button onClick={() => handleSort('city')} className="flex items-center gap-1 hover:text-ink">
                      Location <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="p-3 text-caption font-sans font-bold tracking-wider uppercase text-body hidden xl:table-cell">
                    <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-ink">
                      Created <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="p-3 text-caption font-sans font-bold tracking-wider uppercase text-body w-10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-hairline hover:bg-canvas-soft transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => handleSelect(t.id)}
                        className="w-4 h-4 accent-ink cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-ink text-canvas flex items-center justify-center text-caption font-bold flex-shrink-0">
                          {t.logo ? (
                            <img src={t.logo} alt="" className="w-9 h-9 object-cover" />
                          ) : (
                            getInitials(t.name)
                          )}
                        </div>
                        <div>
                          <p className="font-sans font-semibold text-body-sm">{t.name}</p>
                          <p className="text-caption font-mono text-body">{t.subdomain || t.slug}.nexaros.in</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {t.owner ? (
                        <div>
                          <p className="text-body-sm font-sans">{t.owner.name}</p>
                          <p className="text-caption font-sans text-body">{t.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-body text-caption font-sans">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell">{getSubscriptionBadge(t)}</td>
                    <td className="p-3">
                      <StatusBadge status={(t as any).status === 'ACTIVE' ? 'active' : (t as any).status === 'SUSPENDED' ? 'inactive' : (t as any).status === 'ARCHIVED' ? 'archived' : t.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className="text-body-sm font-sans">{[t.city, t.state].filter(Boolean).join(', ') || '—'}</span>
                    </td>
                    <td className="p-3 hidden xl:table-cell">
                      <span className="text-caption font-sans text-body">{formatDate(t.createdAt)}</span>
                    </td>
                    <td className="p-3">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenu(actionMenu === t.id ? null : t.id)}
                          className="p-1 hover:bg-ink hover:text-canvas transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {actionMenu === t.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 z-50 bg-canvas border-2 border-ink shadow-lg w-48">
                              <button onClick={() => { setViewTenant(t); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-body-sm font-sans hover:bg-ink hover:text-canvas flex items-center gap-2">
                                <Eye size={14} /> View
                              </button>
                              <button onClick={() => { setEditTenant(t); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-body-sm font-sans hover:bg-ink hover:text-canvas flex items-center gap-2">
                                <Edit size={14} /> Edit
                              </button>
                              <button onClick={() => { handleStatusToggle(t); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-body-sm font-sans hover:bg-ink hover:text-canvas flex items-center gap-2">
                                {t.isActive ? <Pause size={14} /> : <Play size={14} />}
                                {t.isActive ? 'Suspend' : 'Activate'}
                              </button>
                              {t.owner && (
                                <button onClick={() => { handleImpersonate(t); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-body-sm font-sans hover:bg-ink hover:text-canvas flex items-center gap-2">
                                  <LogIn size={14} /> Login as Owner
                                </button>
                              )}
                              {t.subdomain && (
                                <a href={`https://${t.subdomain}.nexaros.in`} target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2 text-body-sm font-sans hover:bg-ink hover:text-canvas flex items-center gap-2" onClick={() => setActionMenu(null)}>
                                  <ExternalLink size={14} /> View Website
                                </a>
                              )}
                              <div className="border-t border-hairline" />
                              <button onClick={() => { setDeleteTenant(t); setActionMenu(null); }} className="w-full text-left px-3 py-2 text-body-sm font-sans hover:bg-danger hover:text-canvas flex items-center gap-2 text-danger">
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-hairline">
            <div className="flex items-center gap-2 text-caption font-sans text-body">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="h-7 px-2 border border-hairline bg-canvas text-caption font-sans"
              >
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>of {pagination.total}</span>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(1)} className="p-1 hover:bg-ink hover:text-canvas disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors">
                <ChevronsLeft size={14} />
              </button>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1 hover:bg-ink hover:text-canvas disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-7 h-7 text-caption font-sans font-semibold transition-colors',
                      p === page ? 'bg-ink text-canvas' : 'hover:bg-ink hover:text-canvas'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1 hover:bg-ink hover:text-canvas disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors">
                <ChevronRight size={14} />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="p-1 hover:bg-ink hover:text-canvas disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink transition-colors">
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* View Dialog */}
      {viewTenant && (
        <Dialog open onClose={() => setViewTenant(null)} title="Restaurant Details" size="lg">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-ink text-canvas flex items-center justify-center text-body-lg font-bold">
                {viewTenant.logo ? <img src={viewTenant.logo} alt="" className="w-14 h-14 object-cover" /> : getInitials(viewTenant.name)}
              </div>
              <div>
                <h3 className="font-display text-display-sm">{viewTenant.name}</h3>
                <p className="text-body-sm font-sans text-body">{viewTenant.subdomain}.nexaros.in</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ['Email', viewTenant.email],
                ['Phone', viewTenant.phone],
                ['City', viewTenant.city],
                ['State', viewTenant.state],
                ['Country', viewTenant.country],
                ['Business Type', viewTenant.businessType],
                ['GST', viewTenant.gstNumber],
                ['Timezone', viewTenant.timezone],
                ['Currency', viewTenant.currency],
                ['Status', viewTenant.isActive ? 'Active' : 'Inactive'],
                ['Plan', viewTenant.subscription?.plan || 'No Plan'],
                ['Subscription Status', viewTenant.subscription?.status || '—'],
                ['Branches', viewTenant.branchCount],
                ['Users', viewTenant.userCount],
                ['Orders', viewTenant.orderCount],
                ['Created', formatDate(viewTenant.createdAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-caption font-sans text-body uppercase tracking-wider">{label}</p>
                  <p className="text-body-sm font-sans font-semibold mt-0.5">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTenant(null)}>Close</Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editTenant && (
        <EditTenantDialog tenant={editTenant} onClose={() => setEditTenant(null)} onSuccess={() => { setEditTenant(null); refetch(); }} />
      )}

      {/* Delete Dialog */}
      {deleteTenant && (
        <Dialog open onClose={() => { if (!deleteLoading) { setDeleteTenant(null); setDeleteConfirm(''); } }} title="Delete Restaurant" size="sm">
          <div className="space-y-3">
            <p className="text-body font-sans">
              This will <strong className="text-danger">permanently delete</strong> <strong>{deleteTenant.name}</strong> and ALL its data including:
            </p>
            <ul className="text-caption font-sans text-body space-y-1 ml-4 list-disc">
              <li>All branches and staff members</li>
              <li>All orders, payments, and transactions</li>
              <li>Menu items, categories, and inventory</li>
              <li>Users, subscriptions, and reservations</li>
              <li>All analytics, reports, and audit logs</li>
            </ul>
            <p className="text-caption font-sans text-danger font-semibold">
              This action cannot be undone.
            </p>
            <p className="text-caption font-sans text-body mt-2">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              disabled={deleteLoading}
              className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body font-sans focus:outline-none disabled:opacity-50"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTenant(null); setDeleteConfirm(''); }} disabled={deleteLoading}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'DELETE' || deleteLoading}
              isLoading={deleteLoading}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteConfirm && (
        <Dialog open onClose={() => setBulkDeleteConfirm(false)} title="Delete Selected Restaurants" size="sm">
          <div className="space-y-3">
            <p className="text-body font-sans">
              This will <strong className="text-danger">permanently delete</strong> <strong>{selectedIds.size} restaurant(s)</strong> and ALL their data.
            </p>
            <p className="text-caption font-sans text-danger font-semibold">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => { setBulkDeleteConfirm(false); handleBulkAction('delete'); }}
            >
              Delete {selectedIds.size} Restaurant(s)
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Click outside to close menus */}
      {(showExportMenu || actionMenu) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowExportMenu(false); setActionMenu(null); }} />
      )}
    </div>
  );
}

function EditTenantDialog({ tenant, onClose, onSuccess }: { tenant: Tenant; onClose: () => void; onSuccess: () => void }) {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: tenant.name || '',
    email: tenant.email || '',
    phone: tenant.phone || '',
    address: tenant.address || '',
    city: tenant.city || '',
    state: tenant.state || '',
    country: tenant.country || '',
    businessType: tenant.businessType || '',
    gstNumber: tenant.gstNumber || '',
    timezone: tenant.timezone || 'Asia/Kolkata',
    currency: tenant.currency || 'INR',
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) { addToast('Restaurant name is required', 'error'); return; }
    setLoading(true);
    try {
      await adminApi.updateTenant(tenant.id, form);
      addToast('Restaurant updated', 'success');
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title="Edit Restaurant" size="lg">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <Input label="Restaurant Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-sans font-semibold text-ink mb-2">Country</label>
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body-sm font-sans">
              {['India', 'UAE', 'United States', 'United Kingdom', 'Singapore', 'Australia'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-body-sm font-sans font-semibold text-ink mb-2">Business Type</label>
            <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body-sm font-sans">
              <option value="">Select</option>
              {['South Indian', 'North Indian', 'Chinese', 'Continental', 'Fast Food', 'Fine Dining', 'Multi-Cuisine', 'Cafe', 'Bakery'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="GST Number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          <div>
            <label className="block text-body-sm font-sans font-semibold text-ink mb-2">Timezone</label>
            <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="w-full h-10 px-3 border-2 border-ink bg-canvas text-body-sm font-sans">
              {['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={loading}>Save Changes</Button>
      </DialogFooter>
    </Dialog>
  );
}
