'use client';
import React, { useState } from 'react';
import { DataTable, Pagination } from '@/components/ui/table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { formatDate, timeAgo } from '@/lib/utils';
import { FileText, Download, Filter, RefreshCw, Eye, Search } from 'lucide-react';

const mockLogs = [
  { id: '1', action: 'tenant.created', actor: 'admin@nexaros.com', target: 'Spice Garden', details: 'New restaurant registered', ip: '192.168.1.1', timestamp: '2025-01-14T10:30:00Z', severity: 'info' },
  { id: '2', action: 'subscription.upgraded', actor: 'system', target: 'Pizza Palace', details: 'Plan changed: Starter → Professional', ip: '—', timestamp: '2025-01-14T10:15:00Z', severity: 'info' },
  { id: '3', action: 'payment.failed', actor: 'system', target: 'Biryani Barn', details: 'Payment of ₹4,999 failed', ip: '—', timestamp: '2025-01-14T09:45:00Z', severity: 'warning' },
  { id: '4', action: 'admin.login', actor: 'admin@nexaros.com', target: '—', details: 'Successful login', ip: '192.168.1.1', timestamp: '2025-01-14T09:30:00Z', severity: 'info' },
  { id: '5', action: 'tenant.suspended', actor: 'admin@nexaros.com', target: 'Food Court Express', details: 'Subscription expired, grace period ended', ip: '192.168.1.1', timestamp: '2025-01-14T08:00:00Z', severity: 'warning' },
  { id: '6', action: 'security.brute_force', actor: 'unknown', target: '—', details: '5 failed login attempts from 203.45.67.89', ip: '203.45.67.89', timestamp: '2025-01-14T07:30:00Z', severity: 'critical' },
  { id: '7', action: 'coupon.created', actor: 'admin@nexaros.com', target: 'PONGAL2025', details: 'Festival coupon created — 20% off, 500 uses', ip: '192.168.1.1', timestamp: '2025-01-14T06:00:00Z', severity: 'info' },
  { id: '8', action: 'tenant.deleted', actor: 'admin@nexaros.com', target: 'Test Restaurant', details: 'Test tenant removed', ip: '192.168.1.1', timestamp: '2025-01-13T22:00:00Z', severity: 'warning' },
];

export default function AuditLogsPage() {
  const [logs] = useState(mockLogs);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const { addToast } = useToastStore();

  const filtered = severityFilter === 'all' ? logs : logs.filter(l => l.severity === severityFilter);

  const columns = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (_: any, row: any) => (
        <div>
          <p className="text-body-sm font-sans">{timeAgo(row.timestamp)}</p>
          <p className="text-caption text-body font-sans">{formatDate(row.timestamp)}</p>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Level',
      render: (_: any, row: any) => (
        <Badge variant={row.severity === 'critical' || row.severity === 'warning' ? 'filled' : 'outline'}>
          {row.severity}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (_: any, row: any) => (
        <span className="text-body-sm font-sans font-mono text-xs">{row.action}</span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.actor}</span>,
    },
    {
      key: 'target',
      header: 'Target',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.target}</span>,
    },
    {
      key: 'details',
      header: 'Details',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{row.details}</span>,
    },
    {
      key: 'ip',
      header: 'IP',
      render: (_: any, row: any) => <span className="text-caption font-mono text-body">{row.ip}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Security" title="Audit Logs" actions={<Button variant="outline" size="sm"><Download size={14} /> Export CSV</Button>} />
      <div className="divider-heavy" />

      <Card padding="sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input type="text" placeholder="Search logs..." className="input pl-9 py-2 text-sm" />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Levels' },
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Warning' },
              { value: 'critical', label: 'Critical' },
            ]}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          />
        </div>
      </Card>

      <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />
      <Pagination page={page} totalPages={1} onPageChange={setPage} total={filtered.length} />
    </div>
  );
}
