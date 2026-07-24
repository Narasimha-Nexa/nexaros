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
import { Search, RefreshCw, Truck, MapPin, Clock, UserCheck, Package, Navigation } from 'lucide-react';

interface DeliveryPartner {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  currentLat?: number;
  currentLng?: number;
  isAvailable: boolean;
}

interface DeliveryOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  partnerId?: string;
  partnerName?: string;
  partnerPhone?: string;
  status: string;
  restaurantName?: string;
  branchName?: string;
  created_at: string;
  updatedAt?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failedReason?: string;
  estimatedDelivery?: string;
  locationTrail: { lat: number; lng: number; timestamp: string }[];
  items?: { name: string; quantity: number; price: number }[];
  totalAmount?: number;
  deliveryFee?: number;
}

interface DeliveryStats {
  activeDeliveries: number;
  pendingAssignment: number;
  deliveredToday: number;
  availablePartners: number;
  failedToday?: number;
  avgDeliveryTime?: number;
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<DeliveryStats>({
    activeDeliveries: 0,
    pendingAssignment: 0,
    deliveredToday: 0,
    availablePartners: 0,
  });
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  const fetchStats = async () => {
    try {
      const result = await adminApi.request('/delivery/stats', { params: {} });
      setStats({
        activeDeliveries: result.activeDeliveries ?? 0,
        pendingAssignment: result.pendingAssignment ?? 0,
        deliveredToday: result.deliveredToday ?? 0,
        availablePartners: result.availablePartners ?? 0,
        failedToday: result.failedToday,
        avgDeliveryTime: result.avgDeliveryTime,
      });
    } catch (err: any) {
      addToast(err.message || 'Failed to load stats', 'error');
    }
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      const result = await adminApi.request('/delivery/active', { params });
      setDeliveries(result.data || []);
      setTotal(result.total || (result.data || []).length);
    } catch (err: any) {
      addToast(err.message || 'Failed to load deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const result = await adminApi.request('/delivery/partners', { params: { available: 'true', limit: '100' } });
      setPartners(result.data || result || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load partners', 'error');
    }
  };

  useEffect(() => { fetchDeliveries(); }, [page, debouncedSearch, statusFilter]);
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchPartners(); }, []);

  const handleAssign = async () => {
    if (!selectedDelivery || !assignPartnerId) return;
    setSubmitting(true);
    try {
      await adminApi.request('/delivery/assign', {
        method: 'POST',
        body: JSON.stringify({ deliveryId: selectedDelivery.id, partnerId: assignPartnerId }),
      });
      addToast('Partner assigned successfully', 'success');
      setShowAssign(false);
      setShowDetail(false);
      setAssignPartnerId('');
      fetchDeliveries();
      fetchStats();
    } catch (err: any) {
      addToast(err.message || 'Failed to assign partner', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (deliveryId: string, status: string) => {
    setSubmitting(true);
    try {
      await adminApi.request(`/delivery/${deliveryId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      addToast(`Delivery marked as ${status}`, 'success');
      fetchDeliveries();
      fetchStats();
    } catch (err: any) {
      addToast(err.message || 'Failed to update status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getNextStatus = (current: string): { label: string; value: string } | null => {
    const flow: Record<string, string> = {
      ASSIGNED: 'PICKED_UP',
      PICKED_UP: 'IN_TRANSIT',
      IN_TRANSIT: 'DELIVERED',
    };
    const next = flow[current];
    if (!next) return null;
    const labels: Record<string, string> = {
      PICKED_UP: 'Pick Up',
      IN_TRANSIT: 'In Transit',
      DELIVERED: 'Delivered',
    };
    return { label: labels[next] || next, value: next };
  };

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order #',
      sortable: true,
      render: (_: any, row: DeliveryOrder) => (
        <span className="text-body-sm font-sans font-semibold">{row.orderNumber || row.orderId}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (_: any, row: DeliveryOrder) => (
        <div>
          <p className="font-sans font-semibold text-sm">{row.customerName}</p>
          {row.customerPhone && <p className="text-caption text-body font-sans">{row.customerPhone}</p>}
        </div>
      ),
    },
    {
      key: 'partnerName',
      header: 'Partner',
      render: (_: any, row: DeliveryOrder) => (
        <span className="text-body-sm font-sans">{row.partnerName || <span className="text-caption italic">Unassigned</span>}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: DeliveryOrder) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (_: any, row: DeliveryOrder) => (
        <span className="text-body-sm font-sans text-body">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: DeliveryOrder) => {
        const next = getNextStatus(row.status);
        if (!next && row.status !== 'FAILED' && row.status !== 'DELIVERED') {
          return !row.partnerId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e: any) => { e.stopPropagation(); setSelectedDelivery(row); setShowAssign(true); }}
            >
              Assign
            </Button>
          ) : null;
        }
        if (row.status === 'FAILED' || row.status === 'DELIVERED') return null;
        if (!next) return null;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={(e: any) => { e.stopPropagation(); handleStatusUpdate(row.id, next.value); }}
          >
            {next.label}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Logistics"
        title="Delivery Management"
        description="Monitor and manage deliveries across all restaurants"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => { fetchDeliveries(); fetchStats(); }}><RefreshCw size={14} /> Refresh</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Deliveries" value={stats.activeDeliveries} />
        <StatCard label="Pending Assignment" value={stats.pendingAssignment} />
        <StatCard label="Delivered Today" value={stats.deliveredToday} />
        <StatCard label="Available Partners" value={stats.availablePartners} />
      </div>

      <div className="divider-heavy" />

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              type="text"
              placeholder="Search deliveries..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input pl-9 py-2 text-sm w-full"
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'PICKED_UP', label: 'Picked Up' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'FAILED', label: 'Failed' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={<Truck size={48} strokeWidth={1} />}
          title="No deliveries found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Active deliveries will appear here once orders are placed.'}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={deliveries}
            onRowClick={(row) => { setSelectedDelivery(row); setShowDetail(true); }}
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

      <Dialog open={showDetail} onClose={() => setShowDetail(false)} title={`Delivery #${selectedDelivery?.orderNumber || selectedDelivery?.orderId || ''}`} size="lg">
        {selectedDelivery && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-display-xs font-sans">{selectedDelivery.customerName}</h3>
                <p className="text-body-sm text-body font-sans">{selectedDelivery.customerPhone || 'No phone'}</p>
              </div>
              <StatusBadge status={selectedDelivery.status} />
            </div>
            <div className="h-[2px] bg-hairline" />
            <div className="grid grid-cols-2 gap-4">
              <div><p className="label">Order #</p><p className="text-body-sm font-sans">{selectedDelivery.orderNumber || selectedDelivery.orderId}</p></div>
              <div><p className="label">Partner</p><p className="text-body-sm font-sans">{selectedDelivery.partnerName || '—'}</p></div>
              <div><p className="label">Restaurant</p><p className="text-body-sm font-sans">{selectedDelivery.restaurantName || '—'}</p></div>
              <div><p className="label">Branch</p><p className="text-body-sm font-sans">{selectedDelivery.branchName || '—'}</p></div>
              <div><p className="label">Created</p><p className="text-body-sm font-sans">{formatDate(selectedDelivery.created_at)}</p></div>
              <div><p className="label">Estimated Delivery</p><p className="text-body-sm font-sans">{selectedDelivery.estimatedDelivery ? formatDate(selectedDelivery.estimatedDelivery) : '—'}</p></div>
              <div><p className="label">Assigned At</p><p className="text-body-sm font-sans">{selectedDelivery.assignedAt ? formatDate(selectedDelivery.assignedAt) : '—'}</p></div>
              <div><p className="label">Delivered At</p><p className="text-body-sm font-sans">{selectedDelivery.deliveredAt ? formatDate(selectedDelivery.deliveredAt) : '—'}</p></div>
              <div className="col-span-2"><p className="label">Delivery Address</p><p className="text-body-sm font-sans">{selectedDelivery.customerAddress || '—'}</p></div>
            </div>

            {selectedDelivery.items && selectedDelivery.items.length > 0 && (
              <>
                <div className="h-[2px] bg-hairline" />
                <div>
                  <p className="label mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedDelivery.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-body-sm font-sans">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="text-body">₹{item.price?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-[2px] bg-hairline my-3" />
                  <div className="flex justify-between text-body-sm font-sans font-semibold">
                    <span>Total</span>
                    <span>₹{selectedDelivery.totalAmount?.toFixed(2) ?? '—'}</span>
                  </div>
                </div>
              </>
            )}

            {selectedDelivery.locationTrail && selectedDelivery.locationTrail.length > 0 && (
              <>
                <div className="h-[2px] bg-hairline" />
                <div>
                  <p className="label mb-2">GPS Location Trail</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedDelivery.locationTrail.map((point, i) => (
                      <div key={i} className="flex items-center gap-2 text-body-sm font-sans">
                        <MapPin size={12} className="text-caption shrink-0" />
                        <span className="text-body">{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</span>
                        <span className="text-caption ml-auto">{formatDate(point.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedDelivery.failedReason && (
              <>
                <div className="h-[2px] bg-hairline" />
                <div>
                  <p className="label">Failure Reason</p>
                  <p className="text-body-sm font-sans text-error">{selectedDelivery.failedReason}</p>
                </div>
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
              {!selectedDelivery.partnerId && selectedDelivery.status !== 'DELIVERED' && selectedDelivery.status !== 'FAILED' && (
                <Button onClick={() => { setShowAssign(true); }}>Assign Partner</Button>
              )}
              {selectedDelivery.partnerId && getNextStatus(selectedDelivery.status) && (
                <Button onClick={() => handleStatusUpdate(selectedDelivery.id, getNextStatus(selectedDelivery.status)!.value)}>
                  {getNextStatus(selectedDelivery.status)!.label}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </Dialog>

      <Dialog open={showAssign} onClose={() => { setShowAssign(false); setAssignPartnerId(''); }} title="Assign Delivery Partner" size="md">
        <div className="space-y-4">
          <Select
            label="Select Partner"
            value={assignPartnerId}
            onChange={(e) => setAssignPartnerId(e.target.value)}
            options={[
              { value: '', label: 'Choose a partner...' },
              ...partners.filter(p => p.isAvailable).map(p => ({ value: p.id, label: `${p.name}${p.phone ? ` (${p.phone})` : ''}` })),
            ]}
          />
          {partners.filter(p => p.isAvailable).length === 0 && (
            <p className="text-body-sm text-caption font-sans">No available partners at this time.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAssign(false); setAssignPartnerId(''); }}>Cancel</Button>
            <Button onClick={handleAssign} isLoading={submitting} disabled={!assignPartnerId}>Assign Partner</Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
