'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { Shield, Smartphone, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

export default function SecurityPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getAdminSessions();
      setSessions(result.sessions || result.data || result || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const activeSessions = sessions.filter((s) => !s.revoked);
  const failedAttempts = sessions.filter((s) => s.failedAttempts || s.failed);

  const stats = [
    { label: 'Active Sessions', value: String(activeSessions.length), change: `${activeSessions.length} device(s)`, changeType: 'neutral' as const },
    { label: 'Total Sessions', value: String(sessions.length), change: 'All time', changeType: 'neutral' as const },
    { label: 'Admin Users', value: String(new Set(sessions.map((s) => s.adminId || s.adminEmail)).size), change: 'Unique users', changeType: 'neutral' as const },
    { label: 'Failed Logins', value: String(failedAttempts.length), change: 'Recent', changeType: (failedAttempts.length > 0 ? 'negative' : 'positive') as 'negative' | 'positive' },
  ];

  const sessionColumns = [
    {
      key: 'device',
      header: 'Session',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3">
          <Smartphone size={16} className="text-body shrink-0" />
          <div>
            <p className="text-body-sm font-sans">{row.userAgent || row.device || 'Unknown device'}</p>
            <p className="text-caption text-body font-sans">{row.ip || row.ipAddress || 'Unknown IP'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'admin',
      header: 'Admin',
      render: (_: any, row: any) => <span className="text-body-sm font-sans">{row.adminEmail || row.adminName || '—'}</span>,
    },
    {
      key: 'lastActive',
      header: 'Last Active',
      render: (_: any, row: any) => <span className="text-body-sm font-sans text-body">{timeAgo(row.lastActive || row.lastActivity || row.updatedAt || row.createdAt)}</span>,
    },
    {
      key: 'current',
      header: 'Status',
      render: (_: any, row: any) => (
        <Badge variant={row.current ? 'filled' : 'outline'}>
          {row.current ? 'Current' : row.revoked ? 'Revoked' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (_: any, row: any) => (
        <div className="flex gap-1">
          {!row.current && !row.revoked && (
            <button
              className="btn-ghost btn-sm p-1.5"
              disabled={revoking === row.id}
              onClick={async () => {
                setRevoking(row.id);
                try {
                  const token = row.token || row.id;
                  await adminApi.request('/admin/auth/sessions/revoke', {
                    method: 'POST',
                    body: JSON.stringify({ token }),
                  });
                  setSessions((prev) => prev.map((s) => s.id === row.id ? { ...s, revoked: true } : s));
                  addToast('Session revoked', 'success');
                } catch {
                  addToast('Failed to revoke session', 'error');
                } finally {
                  setRevoking(null);
                }
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Security Center"
        actions={<Button variant="outline" size="sm" onClick={fetchSessions}><RefreshCw size={14} /> Refresh</Button>}
      />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display-xs font-sans">Active Sessions</h2>
          <Button variant="outline" size="sm" onClick={fetchSessions}><RefreshCw size={14} /> Refresh</Button>
        </div>
        {loading ? (
          <div className="space-y-1">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-[52px] w-full" />)}</div>
        ) : activeSessions.length === 0 ? (
          <p className="text-body-sm text-body font-sans">No active sessions.</p>
        ) : (
          <DataTable columns={sessionColumns} data={activeSessions} keyExtractor={(r: any) => r.id} />
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} />
          <h2 className="text-display-xs font-sans">Security Settings</h2>
        </div>
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
    </div>
  );
}
