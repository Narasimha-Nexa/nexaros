'use client';
import React, { useState, useEffect } from 'react';
import { DataTable, Pagination } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { FileText, Download, RefreshCw, Search } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { addToast } = useToastStore();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getAuditLogs(page, 20);
      const logsData = result.data || result.logs || [];
      setLogs(logsData);
      setTotal(result.total || logsData.length);
    } catch (err: any) {
      addToast(err.message || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const filtered = logs.filter((log) => {
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesSearch = !search || 
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.actor?.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

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
            <Button variant="outline" size="sm" disabled><Download size={14} /> Export CSV</Button>
          </>
        }
      />
      <div className="divider-heavy" />

      <Card padding="sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              type="text"
              placeholder="Search logs..."
              className="input pl-9 py-2 text-sm"
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
        <div className="space-y-3">{[...Array(8)].map((_, i) => <Card key={i} className="h-12 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-body-sm text-body font-sans">No audit logs found.</p>
        </Card>
      ) : (
        <>
          <DataTable columns={columns} data={filtered} keyExtractor={(r: any) => r.id} />
          <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} total={total} />
        </>
      )}
    </div>
  );
}
