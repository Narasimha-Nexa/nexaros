'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useToastStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { cn, formatDate, getInitials } from '@/lib/utils';
import {
  MapPin, Search, RefreshCw, Filter, MoreHorizontal,
  Eye, Building2, Users, ShoppingCart, Table, ChevronDown, X, Loader2,
  CheckCircle, XCircle, Pause, Archive,
} from 'lucide-react';

const BRANCH_STATUS_OPTIONS = ['ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED'];

export default function BranchesPage() {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [viewBranch, setViewBranch] = useState<any>(null);
  const [statusModal, setStatusModal] = useState<{ branch: any; status: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, tenantFilter, limit]);

  const queryParams: Record<string, string> = {
    page: String(page),
    limit: String(limit),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter && { status: statusFilter }),
    ...(tenantFilter && { tenantId: tenantFilter }),
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-branches', queryParams],
    queryFn: () => adminApi.listBranches(queryParams),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateBranchStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      addToast('Branch status updated', 'success');
      setStatusModal(null);
    },
    onError: (e: any) => {
      addToast(e.message || 'Failed to update status', 'error');
    },
  });

  const branches = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const stats = React.useMemo(() => {
    const all = data?.data || [];
    return {
      total: data?.total || 0,
      active: all.filter((b: any) => b.status === 'ACTIVE').length,
      paused: all.filter((b: any) => b.status === 'PAUSED').length,
      closed: all.filter((b: any) => b.status === 'CLOSED').length,
    };
  }, [data]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'PAUSED': return 'text-yellow-600 bg-yellow-50';
      case 'CLOSED': return 'text-red-600 bg-red-50';
      case 'ARCHIVED': return 'text-gray-600 bg-gray-50';
      default: return 'text-body bg-muted';
    }
  };

  const columns = [
    {
      key: 'name', header: 'Branch',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{row.displayName || row.name}</div>
            <div className="text-xs text-muted truncate">{row.code || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'tenant', header: 'Tenant',
      render: (_: any, row: any) => (
        <div className="text-sm">
          <div className="truncate max-w-[160px]">{row.tenant?.name || '—'}</div>
          <div className="text-xs text-muted truncate max-w-[160px]">{row.city || row.address || '—'}</div>
        </div>
      ),
    },
    {
      key: 'branchType', header: 'Type',
      render: (val: any) => (
        <Badge variant="outline">{val || 'PRIMARY'}</Badge>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (val: any) => (
        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusColor(val))}>
          {val || 'ACTIVE'}
        </span>
      ),
    },
    {
      key: '_count', header: 'Counts',
      render: (val: any) => (
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><Users size={12} />{val?.staff || 0}</span>
          <span className="flex items-center gap-1"><ShoppingCart size={12} />{val?.orders || 0}</span>
          <span className="flex items-center gap-1"><Table size={12} />{val?.tables || 0}</span>
        </div>
      ),
    },
    {
      key: 'createdAt', header: 'Created',
      render: (val: any) => <span className="text-xs text-muted">{formatDate(val)}</span>,
    },
    {
      key: 'actions', header: '',
      className: 'w-12',
      render: (_: any, row: any) => (
        <div className="relative">
          <button
            className="btn-ghost p-1"
            onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === row.id ? null : row.id); }}
          >
            <MoreHorizontal size={16} />
          </button>
          {actionMenu === row.id && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />
              <div className="absolute right-0 top-full mt-1 w-48 card p-1 z-50 shadow-lg">
                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent text-left"
                  onClick={() => { setViewBranch(row); setActionMenu(null); }}>
                  <Eye size={14} /> View Details
                </button>
                {row.status !== 'ACTIVE' && (
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent text-left text-green-600"
                    onClick={() => { setStatusModal({ branch: row, status: 'ACTIVE' }); setActionMenu(null); }}>
                    <CheckCircle size={14} /> Activate
                  </button>
                )}
                {row.status === 'ACTIVE' && (
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent text-left text-yellow-600"
                    onClick={() => { setStatusModal({ branch: row, status: 'PAUSED' }); setActionMenu(null); }}>
                    <Pause size={14} /> Pause
                  </button>
                )}
                {row.status !== 'CLOSED' && (
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent text-left text-red-600"
                    onClick={() => { setStatusModal({ branch: row, status: 'CLOSED' }); setActionMenu(null); }}>
                    <XCircle size={14} /> Close
                  </button>
                )}
                {row.status !== 'ARCHIVED' && (
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent text-left text-gray-600"
                    onClick={() => { setStatusModal({ branch: row, status: 'ARCHIVED' }); setActionMenu(null); }}>
                    <Archive size={14} /> Archive
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-sm text-muted mt-1">Manage all restaurant branches across tenants</p>
        </div>
        <Button variant="ghost" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Branches" value={stats.total} />
        <StatCard label="Active" value={stats.active} className="text-green-600" />
        <StatCard label="Paused" value={stats.paused} className="text-yellow-600" />
        <StatCard label="Closed" value={stats.closed} className="text-red-600" />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              ref={searchRef}
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input h-9 text-sm"
          >
            <option value="">All Status</option>
            {BRANCH_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Input
            placeholder="Tenant ID"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="w-40"
          />
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="input h-9 text-sm w-20"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </Card>

      <div className="card overflow-hidden overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={cn(col.className)}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}><div className="skeleton h-4 w-full rounded" /></td>
                  ))}
                </tr>
              ))
            ) : branches.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <EmptyState
                    icon={<MapPin size={40} />}
                    title="No branches found"
                    description="Branches will appear here after restaurants are provisioned."
                  />
                </td>
              </tr>
            ) : (
              branches.map((row: any) => (
                <tr key={row.id} onClick={() => setViewBranch(row)} className="cursor-pointer hover:bg-accent/50">
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={limit} />
      )}

      {viewBranch && (
        <Dialog open={!!viewBranch} title={`Branch: ${viewBranch.displayName || viewBranch.name}`} onClose={() => setViewBranch(null)}>
          <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['ID', viewBranch.id],
                ['Code', viewBranch.code || '—'],
                ['Display Name', viewBranch.displayName || '—'],
                ['Type', viewBranch.branchType || 'PRIMARY'],
                ['Status', viewBranch.status],
                ['Tenant', viewBranch.tenant?.name || '—'],
                ['Address', viewBranch.address || '—'],
                ['City', viewBranch.city || '—'],
                ['State', viewBranch.state || '—'],
                ['Country', viewBranch.country || '—'],
                ['Postal Code', viewBranch.postalCode || '—'],
                ['Email', viewBranch.email || '—'],
                ['Phone', viewBranch.phone || '—'],
                ['Timezone', viewBranch.timezone || '—'],
                ['Currency', viewBranch.currency || '—'],
                ['Dining Capacity', viewBranch.diningCapacity ?? '—'],
                ['Delivery Radius', viewBranch.deliveryRadius ?? '—'],
                ['Latitude', viewBranch.latitude ?? '—'],
                ['Longitude', viewBranch.longitude ?? '—'],
                ['Staff Count', viewBranch._count?.staff ?? 0],
                ['Order Count', viewBranch._count?.orders ?? 0],
                ['Table Count', viewBranch._count?.tables ?? 0],
                ['Created', formatDate(viewBranch.createdAt)],
                ['Updated', formatDate(viewBranch.updatedAt)],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <span className="text-muted text-xs">{label}</span>
                  <div className="font-medium truncate">{String(value)}</div>
                </div>
              ))}
            </div>
            {viewBranch.staff?.length > 0 && (
              <div>
                <span className="text-muted text-xs">Staff (first 10)</span>
                <div className="mt-1 space-y-1">
                  {viewBranch.staff.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                        {getInitials(s.name)}
                      </div>
                      <span>{s.name}</span>
                      <span className="text-muted">({s.role?.name || '—'})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewBranch(null)}>Close</Button>
          </DialogFooter>
        </Dialog>
      )}

      {statusModal && (
        <Dialog open={!!statusModal} title="Update Branch Status" onClose={() => setStatusModal(null)}>
          <p className="text-sm text-body mb-4">
            Change <strong>{statusModal.branch.displayName || statusModal.branch.name}</strong> status to <strong>{statusModal.status}</strong>?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusModal(null)}>Cancel</Button>
            <Button
              onClick={() => statusMutation.mutate({ id: statusModal.branch.id, status: statusModal.status })}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
