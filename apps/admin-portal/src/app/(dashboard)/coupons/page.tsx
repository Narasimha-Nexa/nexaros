'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { useToastStore } from '@/stores/ui.store';
import { PageHeader } from '@/components/layout/page-header';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Tag, Plus, Percent, Copy, Trash2, RefreshCw, PartyPopper } from 'lucide-react';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showFestival, setShowFestival] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: 0, maxUses: 100, validFrom: '', validUntil: '', minAmount: 0 });
  const [festivalForm, setFestivalForm] = useState({ name: '', discountPercent: 20, expiry: '', maxUses: 500 });
  const [creating, setCreating] = useState(false);
  const { addToast } = useToastStore();

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getCoupons();
      setCoupons(result.data || result.coupons || result || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await adminApi.createCoupon({
        code: form.code.toUpperCase(),
        type: form.type,
        value: form.value,
        maxUses: form.maxUses,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        minAmount: form.minAmount || undefined,
      });
      addToast('Coupon created successfully', 'success');
      setShowCreate(false);
      setForm({ code: '', type: 'percentage', value: 0, maxUses: 100, validFrom: '', validUntil: '', minAmount: 0 });
      fetchCoupons();
    } catch (err: any) {
      addToast(err.message || 'Failed to create coupon', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleFestival = async () => {
    setCreating(true);
    try {
      await adminApi.createFestivalCampaign(festivalForm.name, festivalForm.discountPercent, festivalForm.expiry, festivalForm.maxUses);
      addToast('Festival campaign created!', 'success');
      setShowFestival(false);
      fetchCoupons();
    } catch (err: any) {
      addToast(err.message || 'Failed to create festival campaign', 'error');
    } finally {
      setCreating(false);
    }
  };

  const activeCoupons = coupons.filter(c => c.status === 'active' || (!c.status && !c.expired));
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || c.usageCount || 0), 0);

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold">{row.code}</span>
          <button onClick={() => { navigator.clipboard.writeText(row.code); addToast('Copied', 'info'); }} className="btn-ghost btn-sm p-1">
            <Copy size={12} />
          </button>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (_: any, row: any) => <Badge variant="outline">{row.type === 'percentage' ? 'Percentage' : 'Fixed'}</Badge>,
    },
    {
      key: 'value',
      header: 'Value',
      render: (_: any, row: any) => <span className="font-sans font-semibold">{row.type === 'percentage' ? `${row.value}%` : `₹${row.value}`}</span>,
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (_: any, row: any) => {
        const used = row.usedCount || row.usageCount || 0;
        const max = row.maxUses || row.maxUsages || 0;
        return (
          <div>
            <p className="text-body-sm font-sans">{used} / {max || '∞'}</p>
            {max > 0 && <div className="w-full h-1 bg-hairline mt-1"><div className="h-1 bg-ink" style={{ width: `${Math.min((used / max) * 100, 100)}%` }} /></div>}
          </div>
        );
      },
    },
    {
      key: 'validUntil',
      header: 'Expires',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{row.validUntil ? formatDate(row.validUntil) : '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status || (row.validUntil && new Date(row.validUntil) < new Date() ? 'expired' : 'active')} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        title="Coupons"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowFestival(true)}><PartyPopper size={14} /> Festival Campaign</Button>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Create Coupon</Button>
          </>
        }
      />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Coupons" value={activeCoupons.length} change="Currently active" changeType="positive" />
        <StatCard label="Total Coupons" value={coupons.length} change="All time" changeType="neutral" />
        <StatCard label="Total Redemptions" value={totalRedemptions.toLocaleString('en-IN')} change="All coupons" changeType="neutral" />
        <StatCard label="Coupon Codes" value={coupons.length} change="Created" changeType="neutral" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Card key={i} className="h-12 animate-pulse" />)}</div>
      ) : (
        <DataTable columns={columns} data={coupons} keyExtractor={(r: any) => r.id} />
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Coupon">
        <div className="space-y-4">
          <Input label="Coupon Code" placeholder="e.g. PONGAL2025" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed Amount (₹)' }]} />
          <Input label={form.type === 'percentage' ? 'Discount %' : 'Amount (₹)'} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          <Input label="Max Uses" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valid From" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
            <Input label="Valid Until" type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
          </div>
          <Input label="Min Subscription Value (₹)" type="number" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: Number(e.target.value) })} hint="Leave 0 for no minimum" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={creating}>Create Coupon</Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog open={showFestival} onClose={() => setShowFestival(false)} title="Create Festival Campaign">
        <div className="space-y-4">
          <p className="text-body-sm font-sans text-body">Create a bulk coupon for a festival (Pongal, Diwali, Ugadi, etc.)</p>
          <Input label="Festival Name" placeholder="e.g. Pongal 2025" value={festivalForm.name} onChange={(e) => setFestivalForm({ ...festivalForm, name: e.target.value })} />
          <Input label="Discount %" type="number" value={festivalForm.discountPercent} onChange={(e) => setFestivalForm({ ...festivalForm, discountPercent: Number(e.target.value) })} />
          <Input label="Expiry Date" type="date" value={festivalForm.expiry} onChange={(e) => setFestivalForm({ ...festivalForm, expiry: e.target.value })} />
          <Input label="Max Total Uses" type="number" value={festivalForm.maxUses} onChange={(e) => setFestivalForm({ ...festivalForm, maxUses: Number(e.target.value) })} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFestival(false)}>Cancel</Button>
            <Button onClick={handleFestival} isLoading={creating}>Create Campaign</Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
