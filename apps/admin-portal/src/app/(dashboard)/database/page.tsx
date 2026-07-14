'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { Database, RefreshCw, Download, HardDrive, Table, Loader2 } from 'lucide-react';

interface TableStat {
  name: string;
  rows: number;
}

interface DatabaseStats {
  tables: TableStat[];
  totalTables: number;
  totalRows: number;
  dbSize: string;
  activeConnections: number;
}

export default function DatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getDatabaseStats();
      setStats(result);
    } catch (err: any) {
      addToast(err.message || 'Failed to load database stats', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const formatRows = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Database"
        actions={
          <>
            <Button variant="outline" size="sm" disabled><Download size={14} /> Backup</Button>
            <Button variant="outline" size="sm" onClick={fetchStats}><RefreshCw size={14} /> Refresh</Button>
          </>
        }
      />
      <div className="divider-heavy" />

      {loading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Card key={i} className="h-24 animate-pulse" />)}
          </div>
          <Card padding="lg" className="text-center">
            <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
            <p className="text-body-sm text-body font-sans">Loading database stats...</p>
          </Card>
        </>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Tables" value={String(stats.totalTables)} change="Prisma schema" changeType="neutral" />
            <StatCard label="Total Rows" value={formatRows(stats.totalRows)} change="Across all tables" changeType="neutral" />
            <StatCard label="Database Size" value={stats.dbSize} change="PostgreSQL" changeType="neutral" />
            <StatCard label="Active Connections" value={String(stats.activeConnections)} change="Current" changeType="neutral" />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-display-xs font-sans">Tables</h2>
              <span className="text-caption font-sans text-body">{stats.totalTables} tables</span>
            </div>
            <div className="divider mb-4" />
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Table Name</th>
                    <th>Rows</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.tables.map((table) => (
                    <tr key={table.name}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Table size={14} />
                          <span className="font-mono text-sm font-semibold">{table.name}</span>
                        </div>
                      </td>
                      <td className="font-sans text-sm">{table.rows.toLocaleString('en-IN')}</td>
                      <td>
                        <Badge variant={table.rows > 0 ? 'filled' : 'outline'}>
                          {table.rows > 0 ? 'Has data' : 'Empty'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <h2 className="text-display-xs font-sans mb-4">Maintenance</h2>
            <div className="divider mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="justify-start" disabled>
                <Download size={14} /> Create Backup
              </Button>
              <Button variant="outline" className="justify-start" disabled>
                <RefreshCw size={14} /> Run VACUUM ANALYZE
              </Button>
              <Button variant="outline" className="justify-start" disabled>
                <HardDrive size={14} /> View Migration History
              </Button>
            </div>
            <p className="text-caption text-body font-sans mt-3">Backup and maintenance operations are coming soon.</p>
          </Card>
        </>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-body-sm text-body font-sans">Failed to load database stats. Backend may not be running.</p>
          <Button variant="outline" size="sm" onClick={fetchStats} className="mt-3"><RefreshCw size={14} /> Retry</Button>
        </Card>
      )}
    </div>
  );
}
