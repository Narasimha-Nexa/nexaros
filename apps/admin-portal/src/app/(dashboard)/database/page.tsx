'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Database, RefreshCw, Download, Trash2, Table, HardDrive } from 'lucide-react';

const tables = [
  { name: 'tenants', rows: '2,847', size: '4.2 MB', lastUpdated: '2 min ago' },
  { name: 'users', rows: '3,214', size: '1.8 MB', lastUpdated: '5 min ago' },
  { name: 'staff', rows: '8,432', size: '2.1 MB', lastUpdated: '10 min ago' },
  { name: 'orders', rows: '1,247,893', size: '892 MB', lastUpdated: '1 min ago' },
  { name: 'payments', rows: '456,789', size: '156 MB', lastUpdated: '3 min ago' },
  { name: 'menu_items', rows: '45,678', size: '12.4 MB', lastUpdated: '1 hour ago' },
  { name: 'audit_logs', rows: '2,891,234', size: '1.2 GB', lastUpdated: '1 min ago' },
  { name: 'subscriptions', rows: '2,156', size: '892 KB', lastUpdated: '15 min ago' },
];

export default function DatabasePage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="System" title="Database" actions={<><Button variant="outline" size="sm"><Download size={14} /> Backup</Button><Button variant="outline" size="sm"><RefreshCw size={14} /> Refresh</Button></>} />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tables" value="49" change="Prisma schema" changeType="neutral" />
        <StatCard label="Total Rows" value="4.6M" change="Across all tables" changeType="neutral" />
        <StatCard label="Database Size" value="2.3 GB" change="PostgreSQL" changeType="neutral" />
        <StatCard label="Active Connections" value="45" change="of 100 max" changeType="neutral" />
      </div>

      <Card>
        <h2 className="text-display-xs font-sans mb-4">Tables</h2>
        <div className="divider mb-4" />
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Table Name</th>
                <th>Rows</th>
                <th>Size</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.name}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Table size={14} />
                      <span className="font-mono text-sm font-semibold">{table.name}</span>
                    </div>
                  </td>
                  <td className="font-sans text-sm">{table.rows}</td>
                  <td className="font-sans text-sm">{table.size}</td>
                  <td className="font-sans text-sm text-body">{table.lastUpdated}</td>
                  <td>
                    <button className="btn-ghost btn-sm p-1.5">
                      <RefreshCw size={14} />
                    </button>
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
          <Button variant="outline" className="justify-start">
            <Download size={14} /> Create Backup
          </Button>
          <Button variant="outline" className="justify-start">
            <RefreshCw size={14} /> Run VACUUM ANALYZE
          </Button>
          <Button variant="outline" className="justify-start">
            <HardDrive size={14} /> View Migration History
          </Button>
        </div>
      </Card>
    </div>
  );
}
