'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { MessageSquare, Phone, Mail, ExternalLink, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export default function DemoRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ new: 0, contacted: 0, converted: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(false);
  const { addToast } = useToastStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        adminApi.getDemoRequests(1, 50, statusFilter || undefined),
        adminApi.getDemoRequestStats().catch(() => null),
      ]);
      setRequests(requestsRes.data || requestsRes.requests || []);
      if (statsRes) {
        const byStatus = statsRes.byStatus || statsRes.statusCounts || {};
        setStats({
          new: byStatus.new || byStatus.NEW || 0,
          contacted: byStatus.contacted || byStatus.CONTACTED || 0,
          converted: byStatus.converted || byStatus.CONVERTED || 0,
          total: statsRes.total || requestsRes.total || 0,
        });
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load demo requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdating(true);
    try {
      await adminApi.updateDemoRequestStatus(id, newStatus);
      addToast(`Status updated to ${newStatus}`, 'success');
      setSelected(null);
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Contact',
      render: (_: any, row: any) => (
        <div>
          <p className="font-sans font-semibold text-sm">{row.name}</p>
          <p className="text-caption text-body font-sans">{row.restaurantName || row.restaurant}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.city || '—'}{row.state ? `, ${row.state}` : ''}</span>,
    },
    {
      key: 'businessType',
      header: 'Type',
      render: (_: any, row: any) => <Badge variant="outline">{row.businessType || 'Restaurant'}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status?.toLowerCase()} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (_: any, row: any) => (
        <div className="flex gap-1">
          {row.phone && <button onClick={(e) => { e.stopPropagation(); window.open(`tel:${row.phone}`); }} className="btn-ghost btn-sm p-1.5"><Phone size={14} /></button>}
          {row.email && <button onClick={(e) => { e.stopPropagation(); window.open(`mailto:${row.email}`); }} className="btn-ghost btn-sm p-1.5"><Mail size={14} /></button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales"
        title="Demo Requests"
        actions={<Button variant="outline" size="sm" onClick={fetchData}><RefreshCw size={14} /> Refresh</Button>}
      />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="New Requests" value={String(stats.new)} change="Needs follow-up" changeType="neutral" />
        <StatCard label="Contacted" value={String(stats.contacted)} change="Awaiting response" changeType="neutral" />
        <StatCard label="Converted" value={String(stats.converted)} change={stats.total > 0 ? `${Math.round((stats.converted / stats.total) * 100)}% conversion` : 'No data'} changeType="positive" />
        <StatCard label="Total Requests" value={String(stats.total)} change="All time" changeType="neutral" />
      </div>

      <Card padding="sm">
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'converted', label: 'Converted' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Card key={i} className="h-12 animate-pulse" />)}</div>
      ) : (
        <DataTable columns={columns} data={requests} onRowClick={(row) => setSelected(row)} keyExtractor={(r: any) => r.id} />
      )}

      <Dialog open={!!selected} onClose={() => setSelected(null)} title="Request Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="label">Name</p><p className="text-body-sm font-sans">{selected.name}</p></div>
              <div><p className="label">Restaurant</p><p className="text-body-sm font-sans">{selected.restaurantName || selected.restaurant || '—'}</p></div>
              <div><p className="label">Email</p><p className="text-body-sm font-sans">{selected.email}</p></div>
              <div><p className="label">Phone</p><p className="text-body-sm font-sans">{selected.phone || '—'}</p></div>
              <div><p className="label">Location</p><p className="text-body-sm font-sans">{selected.city || '—'}{selected.state ? `, ${selected.state}` : ''}</p></div>
              <div><p className="label">Business Type</p><p className="text-body-sm font-sans">{selected.businessType || 'Restaurant'}</p></div>
              <div><p className="label">Status</p><StatusBadge status={selected.status?.toLowerCase()} /></div>
              <div><p className="label">Created</p><p className="text-body-sm font-sans">{formatDate(selected.createdAt)}</p></div>
            </div>
            {selected.notes && (
              <div><p className="label">Notes</p><p className="text-body-sm font-sans text-body mt-1">{selected.notes}</p></div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              {selected.status?.toLowerCase() === 'new' && (
                <Button onClick={() => handleStatusUpdate(selected.id, 'contacted')} isLoading={updating}>Mark as Contacted</Button>
              )}
              {selected.status?.toLowerCase() === 'contacted' && (
                <Button onClick={() => handleStatusUpdate(selected.id, 'converted')} isLoading={updating}>Mark as Converted</Button>
              )}
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
