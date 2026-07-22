'use client';
import React, { useState, useEffect } from 'react';
import { DataTable, Pagination } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { FileText, Download, RefreshCw, Search } from 'lucide-react';

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { addToast } = useToastStore();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, severityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result: any = await adminApi.getAuditLogs(
        page, PAGE_SIZE,
        debouncedSearch || undefined,
        severityFilter !== 'all' ? severityFilter : undefined,
      );
      const logsData = result.data || result.logs || [];
      setLogs(logsData);
      setTotal(result.total || logsData.length);
    } catch (err: any) {
      addToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, debouncedSearch, severityFilter]);

  const columns = [
    {
      key: 'timestamp',
      header: 'Time',
      render: (_: any, row: any) => (
        <div>
          <p className="text-body-sm font-sans">{timeAgo(row.timestamp || row.createdAt)}</p>
          <p className="text-caption text-body font-sans">{formatDate(row.timestamp || row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Level',
      render: (_: any, row: any) => (
        <Badge variant={row.severity === 'critical' || row.severity === 'error' || row.severity === 'warning' ? 'filled' : 'outline'}>
          {row.severity || 'info'}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (_: any, row: any) => <span className="text-body-sm font-sans font-mono text-xs">{row.action || row.event || '—'}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.actor || row.adminEmail || 'system'}</span>,
    },
    {
      key: 'target',
      header: 'Target',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.target || row.entityId || '—'}</span>,
    },
    {
      key: 'details',
      header: 'Details',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body truncate max-w-xs block">{row.details || row.description || '—'}</span>,
    },
    {
      key: 'ip',
      header: 'IP',
      render: (_: any, row: any) => <span className="text-caption font-mono text-body">{row.ip || row.ipAddress || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Audit Logs"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchLogs}><RefreshCw size={14} /> Refresh</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const headers = ['Action', 'Entity', 'Entity ID', 'IP Address', 'Created At'];
              const rows = logs.map((log: any) => [log.action, log.entity, log.entityId, log.ipAddress || '', log.createdAt]);
              const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`; a.click();
              URL.revokeObjectURL(url);
              addToast('CSV exported', 'success');
            }}><Download size={14} /> Export CSV</Button>
          </>
        }
      />
      <div className="divider-heavy" />

      <Card padding="sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <Input
              placeholder="Search logs..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Levels' },
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' },
              { value: 'critical', label: 'Critical' },
            ]}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <div className="divide-y divide-hairline">{[...Array(8)].map((_, i) => <div key={i} className="skeleton h-[52px] w-full" />)}</div>
      ) : logs.length === 0 ? (
        <Card padding="md" className="text-center">
          <p className="text-body-sm text-body font-sans">No audit logs found.</p>
        </Card>
      ) : (
        <>
          <DataTable columns={columns} data={logs} keyExtractor={(r: any) => r.id} />
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} total={total} />
        </>
      )}
    </div>
  );
}
