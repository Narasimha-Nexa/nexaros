'use client';
import React, { useState, useEffect } from 'react';
import { DataTable, Pagination } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CreditCard, RefreshCw, ArrowUpDown, Eye, CheckCircle, Clock, Ban } from 'lucide-react';
import type { Subscription } from '@/types';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const { addToast } = useToastStore();

  const handleTransition = async (tenantId: string, status: string) => {
    setTransitioning(true);
    try {
      await adminApi.request('/billing/transition', {
        method: 'POST',
        body: JSON.stringify({ tenantId, status, reason: `Admin manual transition to ${status}` }),
      });
      addToast(`Subscription transitioned to ${status}`, 'success');
      fetchSubscriptions();
      setSelected(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to transition', 'error');
    }
    setTransitioning(false);
  };

  const handleRecordPayment = async (tenantId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      addToast('Enter a valid amount', 'error');
      return;
    }
    setTransitioning(true);
    try {
      await adminApi.request('/billing/transition', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          status: 'ACTIVE',
          reason: `Admin recorded manual payment of ₹${paymentAmount}`,
          paymentRef: paymentRef || undefined,
          amount: parseFloat(paymentAmount),
        }),
      });
      addToast(`Payment of ₹${paymentAmount} recorded and subscription activated`, 'success');
      setPaymentAmount('');
      setPaymentRef('');
      fetchSubscriptions();
      setSelected(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to record payment', 'error');
    }
    setTransitioning(false);
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const result = await adminApi.request('/admin/subscriptions', { params });
      setSubscriptions(result.data || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      addToast(err.message || 'Failed to load subscriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubscriptions(); }, [page, search, statusFilter]);

  const stats = [
    { label: 'Active Subscriptions', value: '2,156', change: '+8.3% this month', changeType: 'positive' as const },
    { label: 'Monthly Revenue', value: '₹42.8L', change: '+15.2% growth', changeType: 'positive' as const },
    { label: 'Trial Conversions', value: '68%', change: '↑ from 62%', changeType: 'positive' as const },
    { label: 'Churn Rate', value: '2.1%', change: '-0.3% improvement', changeType: 'positive' as const },
  ];

  const columns = [
    {
      key: 'tenant',
      header: 'Tenant',
      render: (_: any, row: any) => (
        <div>
          <p className="font-sans font-semibold text-sm">{row.tenantName || row.tenant?.name || '—'}</p>
          <p className="text-caption text-body font-sans">{row.tenantEmail || row.tenant?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (_: any, row: any) => <StatusBadge status={row.plan || 'trial'} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status || 'active'} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (_: any, row: any) => (
        <span className="font-sans font-semibold">{row.amount ? formatCurrency(row.amount) : '—'}</span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (_: any, row: any) => (
        <span className="text-body-sm font-sans text-body">{row.startDate ? formatDate(row.startDate) : '—'}</span>
      ),
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (_: any, row: any) => (
        <span className="text-body-sm font-sans text-body">{row.endDate ? formatDate(row.endDate) : '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (_: any, row: any) => (
        <button onClick={(e) => { e.stopPropagation(); setSelected(row); }} className="btn-ghost btn-sm p-1.5" title="View">
          <Eye size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Revenue" title="Subscriptions" actions={<Button variant="outline" size="sm" onClick={fetchSubscriptions}><RefreshCw size={14} /> Refresh</Button>} />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <Card padding="sm">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input py-2 text-sm max-w-sm"
          />
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'trial', label: 'Trial' },
              { value: 'expired', label: 'Expired' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <>
          <DataTable columns={columns} data={subscriptions} keyExtractor={(r) => r.id} />
          <Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} total={total} />
        </>
      )}

      <Dialog open={!!selected} onClose={() => { setSelected(null); setPaymentAmount(''); setPaymentRef(''); }} title="Subscription Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="label">Tenant</p><p className="text-body-sm font-sans">{selected.tenantName || selected.tenant?.name || '—'}</p></div>
              <div><p className="label">Plan</p><StatusBadge status={selected.plan || 'trial'} /></div>
              <div><p className="label">Status</p><StatusBadge status={selected.status || 'active'} /></div>
              <div><p className="label">Amount</p><p className="text-body-sm font-sans">{selected.amount ? formatCurrency(selected.amount) : '—'}</p></div>
              <div><p className="label">Start Date</p><p className="text-body-sm font-sans">{selected.startDate ? formatDate(selected.startDate) : '—'}</p></div>
              <div><p className="label">End Date</p><p className="text-body-sm font-sans">{selected.endDate ? formatDate(selected.endDate) : '—'}</p></div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-hairline pt-4">
              <p className="label mb-2">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleTransition(selected.tenantId || selected.tenant?.id, 'ACTIVE')} disabled={transitioning || selected.status === 'ACTIVE'}>
                  <CheckCircle size={14} /> Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleTransition(selected.tenantId || selected.tenant?.id, 'PAYMENT_PENDING')} disabled={transitioning || selected.status === 'PAYMENT_PENDING'}>
                  <Clock size={14} /> Mark Pending
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleTransition(selected.tenantId || selected.tenant?.id, 'SUSPENDED')} disabled={transitioning || selected.status === 'SUSPENDED'}>
                  <Ban size={14} /> Suspend
                </Button>
              </div>
            </div>

            {/* Manual Payment Recording */}
            <div className="border-t border-hairline pt-4">
              <p className="label mb-2">Record Manual Payment</p>
              <p className="text-xs text-body mb-3">For cash, cheque, bank transfer, or UPI payments received outside Razorpay</p>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Amount (₹)" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="text-sm" />
                <Input type="text" placeholder="Reference / Transaction ID" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="text-sm" />
              </div>
              <Button
                size="sm"
                onClick={() => handleRecordPayment(selected.tenantId || selected.tenant?.id)}
                disabled={transitioning || !paymentAmount}
                className="mt-3"
              >
                <CreditCard size={14} /> Record Payment & Activate
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
