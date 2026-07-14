'use client';
import React, { useState } from 'react';
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
import { formatDate } from '@/lib/utils';
import { Tag, Plus, Percent, Copy, Trash2 } from 'lucide-react';

const mockCoupons = [
  { id: '1', code: 'PONGAL2025', type: 'percentage', value: 20, maxUses: 500, usedCount: 123, validFrom: '2025-01-14', validUntil: '2025-01-20', status: 'active' },
  { id: '2', code: 'WELCOME500', type: 'fixed', value: 500, maxUses: 1000, usedCount: 456, validFrom: '2025-01-01', validUntil: '2025-03-31', status: 'active' },
  { id: '3', code: 'DIWALI30', type: 'percentage', value: 30, maxUses: 200, usedCount: 200, validFrom: '2024-11-01', validUntil: '2024-11-15', status: 'expired' },
  { id: '4', code: 'FREEMONTH', type: 'fixed', value: 1499, maxUses: 50, usedCount: 12, validFrom: '2025-01-10', validUntil: '2025-02-10', status: 'active' },
];

export default function CouponsPage() {
  const [coupons] = useState(mockCoupons);
  const [showCreate, setShowCreate] = useState(false);
  const { addToast } = useToastStore();

  const stats = [
    { label: 'Active Coupons', value: '3', change: '123 redemptions', changeType: 'neutral' as const },
    { label: 'Total Redemptions', value: '791', change: 'All time', changeType: 'neutral' as const },
    { label: 'Revenue Impact', value: '₹2.1L', change: 'Discount value given', changeType: 'negative' as const },
    { label: 'Avg Discount', value: '₹265', change: 'Per redemption', changeType: 'neutral' as const },
  ];

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
      render: (_: any, row: any) => (
        <div>
          <p className="text-body-sm font-sans">{row.usedCount} / {row.maxUses}</p>
          <div className="w-full h-1 bg-hairline mt-1">
            <div className="h-1 bg-ink" style={{ width: `${(row.usedCount / row.maxUses) * 100}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'validUntil',
      header: 'Expires',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{formatDate(row.validUntil)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-16',
      render: (_: any, row: any) => (
        <button className="btn-ghost btn-sm p-1.5" onClick={() => addToast('Coupon deleted', 'success')}>
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Promotions" title="Coupons" actions={<Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Create Coupon</Button>} />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <DataTable columns={columns} data={coupons} keyExtractor={(r) => r.id} />

      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Coupon">
        <div className="space-y-4">
          <Input label="Coupon Code" placeholder="e.g. PONGAL2025" />
          <Select label="Type" options={[{ value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: 'Fixed Amount (₹)' }]} />
          <Input label="Value" type="number" placeholder="20" />
          <Input label="Max Uses" type="number" placeholder="500" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valid From" type="date" />
            <Input label="Valid Until" type="date" />
          </div>
          <Input label="Min Subscription Value (₹)" type="number" placeholder="Optional minimum" hint="Leave empty for no minimum" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { addToast('Coupon created', 'success'); setShowCreate(false); }}>Create Coupon</Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}
