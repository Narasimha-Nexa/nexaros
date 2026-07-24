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
import { Search, Plus, RefreshCw, CalendarDays, Users, Clock, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber?: string;
  status: string;
  notes?: string;
  tenantId: string;
  tenantName?: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, dateFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const result = await adminApi.request('/reservations', { params });
      setReservations(result.data || []);
      setTotal(result.total || (result.data || []).length);
    } catch (err: any) {
      addToast(err.message || 'Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, [page, debouncedSearch, statusFilter, dateFilter]);

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await adminApi.request(`/reservations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      addToast(`Reservation ${status.toLowerCase()}`, 'success');
      fetchReservations();
      if (selectedReservation?.id === id) {
        setSelectedReservation({ ...selectedReservation!, status });
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to update reservation', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdating(id);
    try {
      await adminApi.request(`/reservations/${id}`, { method: 'DELETE' });
      addToast('Reservation deleted', 'success');
      setShowDetail(false);
      setSelectedReservation(null);
      fetchReservations();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete reservation', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const statusCounts = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    arrived: reservations.filter(r => r.status === 'ARRIVED').length,
    cancelled: reservations.filter(r => r.status === 'CANCELLED').length,
    noShow: reservations.filter(r => r.status === 'NO_SHOW').length,
  };

  const getActionsForStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return [
          { label: 'Confirm', status: 'CONFIRMED' },
          { label: 'Cancel', status: 'CANCELLED' },
        ];
      case 'CONFIRMED':
        return [
          { label: 'Arrived', status: 'ARRIVED' },
          { label: 'Cancel', status: 'CANCELLED' },
          { label: 'No Show', status: 'NO_SHOW' },
        ];
      case 'ARRIVED':
        return [
          { label: 'Complete', status: 'COMPLETED' },
        ];
      default:
        return [];
    }
  };

  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (_: any, row: Reservation) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-ink text-canvas flex items-center justify-center text-[11px] font-bold shrink-0">
            {getInitials(row.customerName)}
          </div>
          <div>
            <p className="font-sans font-semibold text-sm">{row.customerName}</p>
            <p className="text-caption text-body font-sans">{row.customerPhone || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date / Time',
      render: (_: any, row: Reservation) => (
        <div>
          <p className="text-body-sm font-sans">{formatDate(row.date)}</p>
          <p className="text-caption text-body font-sans">{row.time || '—'}</p>
        </div>
      ),
    },
    {
      key: 'partySize',
      header: 'Guests',
      render: (_: any, row: Reservation) => (
        <span className="text-body-sm font-sans">{row.partySize}</span>
      ),
    },
    {
      key: 'tableNumber',
      header: 'Table',
      render: (_: any, row: Reservation) => (
        <span className="text-body-sm font-sans">{row.tableNumber || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: Reservation) => <StatusBadge status={row.status} />,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (_: any, row: Reservation) => (
        <span className="text-body-sm font-sans text-body max-w-[160px] truncate block">{row.notes || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bookings"
        title="Reservations"
        description="Manage reservations across all restaurants on the platform"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchReservations}><RefreshCw size={14} /> Refresh</Button>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> New Reservation</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Today" value={statusCounts.total} />
        <StatCard label="Confirmed" value={statusCounts.confirmed} />
        <StatCard label="Arrived" value={statusCounts.arrived} />
        <StatCard label="Cancelled" value={statusCounts.cancelled} />
        <StatCard label="No Show" value={statusCounts.noShow} />
      </div>

      <div className="divider-heavy" />

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="text-sm"
          />
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'ARRIVED', label: 'Arrived' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
              { value: 'NO_SHOW', label: 'No Show' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={48} strokeWidth={1} />}
          title="No reservations found"
          description={search || statusFilter !== 'all' || dateFilter ? 'Try adjusting your search or filters.' : 'Reservations will appear here once customers start booking.'}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={reservations}
            onRowClick={(row) => { setSelectedReservation(row); setShowDetail(true); }}
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

      <Dialog open={showDetail} onClose={() => setShowDetail(false)} title="Reservation Details" size="lg">
        {selectedReservation && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-ink text-canvas flex items-center justify-center text-lg font-bold shrink-0">
                {getInitials(selectedReservation.customerName)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-display-xs font-sans">{selectedReservation.customerName}</h3>
                <p className="text-body-sm text-body font-sans">{selectedReservation.customerPhone || 'No phone'}</p>
              </div>
              <StatusBadge status={selectedReservation.status} />
            </div>
            <div className="h-[2px] bg-hairline" />
            <div className="grid grid-cols-2 gap-4">
              <div><p className="label">Date</p><p className="text-body-sm font-sans">{formatDate(selectedReservation.date)}</p></div>
              <div><p className="label">Time</p><p className="text-body-sm font-sans">{selectedReservation.time || '—'}</p></div>
              <div><p className="label">Party Size</p><p className="text-body-sm font-sans">{selectedReservation.partySize} guests</p></div>
              <div><p className="label">Table</p><p className="text-body-sm font-sans">{selectedReservation.tableNumber || 'Unassigned'}</p></div>
              <div><p className="label">Email</p><p className="text-body-sm font-sans">{selectedReservation.customerEmail || '—'}</p></div>
              <div><p className="label">Restaurant</p><p className="text-body-sm font-sans">{selectedReservation.tenantName || '—'}</p></div>
              <div><p className="label">Branch</p><p className="text-body-sm font-sans">{selectedReservation.branchName || '—'}</p></div>
              <div><p className="label">Created</p><p className="text-body-sm font-sans">{formatDate(selectedReservation.createdAt)}</p></div>
            </div>
            {selectedReservation.notes && (
              <div>
                <p className="label">Notes</p>
                <p className="text-body-sm font-sans text-body bg-canvas-soft p-3 rounded">{selectedReservation.notes}</p>
              </div>
            )}
            {getActionsForStatus(selectedReservation.status).length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-hairline">
                {getActionsForStatus(selectedReservation.status).map((action) => (
                  <Button
                    key={action.status}
                    variant={action.status === 'CANCELLED' || action.status === 'NO_SHOW' ? 'danger' : 'primary'}
                    size="sm"
                    isLoading={updating === selectedReservation.id}
                    onClick={() => handleStatusUpdate(selectedReservation.id, action.status)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="danger"
                size="sm"
                isLoading={updating === selectedReservation.id}
                onClick={() => handleDelete(selectedReservation.id)}
              >
                <Trash2 size={14} /> Delete
              </Button>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="New Reservation" size="lg">
        <ReservationForm onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchReservations(); }} />
      </Dialog>
    </div>
  );
}

function ReservationForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    date: '',
    time: '',
    partySize: '2',
    tableNumber: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.request('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          partySize: parseInt(form.partySize, 10),
        }),
      });
      addToast('Reservation created', 'success');
      onSuccess();
    } catch (err: any) {
      addToast(err.message || 'Failed to create reservation', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Customer Name"
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          required
        />
        <Input
          label="Phone"
          type="tel"
          value={form.customerPhone}
          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
        />
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <Input
          label="Time"
          type="time"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          required
        />
        <Select
          label="Party Size"
          value={form.partySize}
          onChange={(e) => setForm({ ...form, partySize: e.target.value })}
          options={Array.from({ length: 20 }, (_, i) => ({
            value: String(i + 1),
            label: `${i + 1} guest${i === 0 ? '' : 's'}`,
          }))}
        />
        <Input
          label="Table Number"
          value={form.tableNumber}
          onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
          placeholder="Optional"
        />
      </div>
      <Input
        label="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        placeholder="Special requests, dietary restrictions, etc."
      />
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" isLoading={loading}>Create Reservation</Button>
      </DialogFooter>
    </form>
  );
}
