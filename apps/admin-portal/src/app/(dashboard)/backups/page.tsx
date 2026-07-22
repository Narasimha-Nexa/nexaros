'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { Database, Plus, RefreshCw, Download, Trash2, RotateCw, HardDrive, Clock, CheckCircle } from 'lucide-react';

interface BackupRecord {
  id: string;
  name: string;
  type: string;
  status: string;
  tables: string[];
  recordCount: number;
  fileSize: number | null;
  duration: number | null;
  error: string | null;
  createdAt: string;
}

const TABLE_OPTIONS = [
  'Tenant', 'Branch', 'User', 'Staff', 'Role', 'Permission', 'MenuCategory', 'MenuItem',
  'Table', 'Order', 'OrderItem', 'Payment', 'Invoice', 'InventoryItem', 'StockMovement',
  'Reservation', 'Customer', 'Coupon', 'Notification', 'AuditLog', 'Subscription',
];

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupType, setBackupType] = useState('full');
  const [selectedTables, setSelectedTables] = useState<string[]>(TABLE_OPTIONS);
  const [triggering, setTriggering] = useState(false);
  const { addToast } = useToastStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [backupsRes, statsRes] = await Promise.allSettled([
        adminApi.listBackups(),
        adminApi.getBackupStats(),
      ]);
      setBackups(backupsRes.status === 'fulfilled' ? (backupsRes.value.data || backupsRes.value || []) : []);
      setStats(statsRes.status === 'fulfilled' ? statsRes.value : null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const triggerBackup = async () => {
    setTriggering(true);
    try {
      await adminApi.triggerBackup({
        name: backupName || `Backup ${new Date().toISOString().slice(0, 10)}`,
        type: backupType,
        tables: backupType === 'custom' ? selectedTables : undefined,
      });
      setShowCreate(false);
      setBackupName('');
      addToast('Backup started — this may take a few moments', 'success');
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      addToast(err.message || 'Failed to start backup', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const restoreBackup = async (id: string) => {
    if (!confirm('⚠️ This will restore the database to this backup point. All current data after this point will be lost. Continue?')) return;
    try {
      await adminApi.restoreBackup(id);
      addToast('Restore initiated', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to restore', 'error');
    }
  };

  const deleteBackup = async (id: string) => {
    if (!confirm('Delete this backup permanently?')) return;
    try {
      await adminApi.deleteBackup(id);
      fetchData();
      addToast('Backup deleted', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} className="text-success" />;
      case 'failed': return <span className="text-error text-xs font-sans">Failed</span>;
      case 'in_progress': return <RotateCw size={14} className="text-warning animate-spin" />;
      default: return <Clock size={14} className="text-body/40" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Database Backups"
        description="Create, restore, and manage database backups for disaster recovery"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw size={14} /></Button>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}><Plus size={14} /> New Backup</Button>
          </div>
        }
      />

      <div className="divider-heavy" />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Backups', value: stats.totalBackups || 0, icon: Database },
            { label: 'Completed', value: stats.completedBackups || 0, icon: CheckCircle },
            { label: 'Failed', value: stats.failedBackups || 0, icon: Trash2 },
            { label: 'Total Size', value: formatSize(stats.totalSizeBytes), icon: HardDrive },
          ].map(s => (
            <Card key={s.label} padding="sm" className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-accent/10 text-accent shrink-0">
                <s.icon size={16} />
              </div>
              <div>
                <p className="text-xl font-sans font-bold">{s.value}</p>
                <p className="text-caption text-body font-sans">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <Card padding="md" className="border-accent">
          <p className="font-sans font-semibold text-sm mb-4">Create New Backup</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Backup name (optional)"
              value={backupName}
              onChange={e => setBackupName(e.target.value)}
              className="border border-ink/10 rounded-lg px-3 py-2 text-sm font-sans bg-surface"
            />
            <div className="flex gap-2">
              {['full', 'schema_only', 'custom'].map(type => (
                <button
                  key={type}
                  onClick={() => setBackupType(type)}
                  className={`flex-1 px-3 py-2 text-xs font-sans rounded-lg border transition-colors capitalize ${
                    backupType === type ? 'bg-accent text-white border-accent' : 'bg-surface text-body border-ink/10'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {backupType === 'custom' && (
            <div className="mb-4">
              <p className="text-caption text-body font-sans mb-2">Select Tables</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {TABLE_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTables(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                    className={`px-2 py-1 text-xs font-sans rounded border transition-colors ${
                      selectedTables.includes(t) ? 'bg-accent text-white border-accent' : 'bg-surface text-body border-ink/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" onClick={triggerBackup} disabled={triggering}>
              {triggering ? <RotateCw size={14} className="animate-spin" /> : <Download size={14} />}
              {triggering ? 'Starting...' : 'Start Backup'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Card key={i} className="h-20 animate-pulse" />)}
        </div>
      ) : backups.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Database size={32} className="mx-auto text-body/30 mb-3" />
          <p className="text-body font-sans">No backups yet. Create your first backup to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {backups.map(bak => (
            <Card key={bak.id} padding="md" className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                {statusIcon(bak.status)}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-sans font-semibold text-sm truncate">{bak.name}</p>
                    <StatusBadge status={bak.status} />
                    <span className="px-2 py-0.5 text-xs font-sans bg-ink/5 rounded capitalize">{bak.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-caption text-body font-sans">{bak.recordCount?.toLocaleString() || 0} records</span>
                    <span className="text-caption text-body font-sans">{formatSize(bak.fileSize)}</span>
                    <span className="text-caption text-body font-sans">{formatDuration(bak.duration)}</span>
                    <span className="text-caption text-body font-sans">{timeAgo(bak.createdAt)}</span>
                  </div>
                  {bak.tables && bak.tables.length > 0 && bak.tables.length < 10 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {bak.tables.map(t => (
                        <span key={t} className="px-1.5 py-0.5 text-[10px] font-mono bg-ink/5 rounded text-body/50">{t}</span>
                      ))}
                    </div>
                  )}
                  {bak.error && <p className="text-xs text-error font-sans mt-1">{bak.error}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {bak.status === 'completed' && (
                  <Button size="sm" variant="outline" onClick={() => restoreBackup(bak.id)} className="text-warning border-warning">
                    <RotateCw size={14} /> Restore
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => deleteBackup(bak.id)} className="text-error" title="Delete"><Trash2 size={14} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
