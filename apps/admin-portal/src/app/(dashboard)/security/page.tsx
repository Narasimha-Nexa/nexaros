'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/table';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { formatDate, timeAgo } from '@/lib/utils';
import { Shield, Key, Smartphone, Lock, AlertTriangle, Eye, Trash2, Plus, RefreshCw } from 'lucide-react';

const mockSessions = [
  { id: '1', device: 'Chrome on macOS', ip: '192.168.1.1', lastActive: '2025-01-14T10:30:00Z', current: true },
  { id: '2', device: 'Firefox on Windows', ip: '10.0.0.45', lastActive: '2025-01-13T15:20:00Z', current: false },
  { id: '3', device: 'Safari on iPhone', ip: '172.16.0.10', lastActive: '2025-01-12T09:10:00Z', current: false },
];

const mockAdminUsers = [
  { id: '1', name: 'Super Admin', email: 'admin@nexaros.com', role: 'SUPER_ADMIN', status: 'active', lastLogin: '2025-01-14T10:30:00Z' },
  { id: '2', name: 'Ravi Kumar', email: 'ravi@nexaros.com', role: 'ADMIN', status: 'active', lastLogin: '2025-01-14T09:00:00Z' },
  { id: '3', name: 'Priya Mehta', email: 'priya@nexaros.com', role: 'ADMIN', status: 'active', lastLogin: '2025-01-13T18:00:00Z' },
  { id: '4', name: 'View Only', email: 'viewer@nexaros.com', role: 'VIEWER', status: 'inactive', lastLogin: '2025-01-10T12:00:00Z' },
];

export default function SecurityPage() {
  const [showAddUser, setShowAddUser] = useState(false);
  const { addToast } = useToastStore();

  const stats = [
    { label: 'Active Sessions', value: '3', change: '2 devices', changeType: 'neutral' as const },
    { label: 'Failed Logins (24h)', value: '12', change: 'From 3 IPs', changeType: 'negative' as const },
    { label: 'Admin Users', value: '4', change: '3 active', changeType: 'neutral' as const },
    { label: 'MFA Coverage', value: '75%', change: '3 of 4 users', changeType: 'positive' as const },
  ];

  const userColumns = [
    {
      key: 'name',
      header: 'User',
      render: (_: any, row: any) => (
        <div>
          <p className="font-sans font-semibold text-sm">{row.name}</p>
          <p className="text-caption text-body font-sans">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (_: any, row: any) => <Badge variant={row.role === 'SUPER_ADMIN' ? 'filled' : 'outline'}>{row.role}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, row: any) => <Badge variant={row.status === 'active' ? 'filled' : 'outline'}>{row.status}</Badge>,
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{timeAgo(row.lastLogin)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (_: any, row: any) => (
        <div className="flex gap-1">
          <button className="btn-ghost btn-sm p-1.5"><Eye size={14} /></button>
          <button className="btn-ghost btn-sm p-1.5"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Security" title="Security Center" />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Users */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display-xs font-sans">Admin Users</h2>
            <Button size="sm" onClick={() => setShowAddUser(true)}>
              <Plus size={14} /> Add User
            </Button>
          </div>
          <DataTable columns={userColumns} data={mockAdminUsers} keyExtractor={(r) => r.id} />
        </Card>

        {/* Active Sessions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display-xs font-sans">Active Sessions</h2>
            <Button variant="outline" size="sm" onClick={() => addToast('Sessions refreshed', 'info')}>
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
          <div className="space-y-3">
            {mockSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border border-hairline">
                <div className="flex items-center gap-3">
                  <Smartphone size={16} />
                  <div>
                    <p className="text-body-sm font-sans">{session.device}</p>
                    <p className="text-caption text-body font-sans">IP: {session.ip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {session.current && <Badge variant="filled">Current</Badge>}
                  {!session.current && (
                    <button className="btn-ghost btn-sm p-1.5 text-body">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <h2 className="text-display-xs font-sans mb-4">Security Settings</h2>
        <div className="divider mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="label">Two-Factor Authentication</p>
            <p className="text-body-sm font-sans mb-2">Require MFA for all admin users</p>
            <Badge variant="filled">Enabled</Badge>
          </div>
          <div>
            <p className="label">Session Timeout</p>
            <p className="text-body-sm font-sans mb-2">Auto-logout after inactivity</p>
            <Badge variant="outline">30 minutes</Badge>
          </div>
          <div>
            <p className="label">IP Allowlist</p>
            <p className="text-body-sm font-sans mb-2">Restrict admin access to specific IPs</p>
            <Badge variant="outline">Not configured</Badge>
          </div>
          <div>
            <p className="label">Login Attempts</p>
            <p className="text-body-sm font-sans mb-2">Lock account after failed attempts</p>
            <Badge variant="filled">5 attempts / 30min lockout</Badge>
          </div>
        </div>
      </Card>

      <Dialog open={showAddUser} onClose={() => setShowAddUser(false)} title="Add Admin User">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Enter name" />
          <Input label="Email" type="email" placeholder="user@nexaros.com" />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button className="flex-1" onClick={() => { addToast('User invited', 'success'); setShowAddUser(false); }}>Send Invite</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
