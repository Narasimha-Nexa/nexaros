'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { Key, Plus, RefreshCw, Copy, Trash2, RotateCw, Shield, Eye, EyeOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(['orders.read', 'menu.read']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const { addToast } = useToastStore();

  const PERMISSION_OPTIONS = [
    'dashboard.read', 'orders.read', 'orders.write', 'menu.read', 'menu.write',
    'inventory.read', 'inventory.write', 'staff.read', 'staff.write',
    'payments.read', 'reports.read', 'customers.read', 'customers.write',
    'settings.read', 'api_access',
  ];

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const result = await adminApi.listApiKeys('platform');
      setKeys(result.data || result || []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    if (!newKeyName.trim()) { addToast('Name required', 'error'); return; }
    try {
      const result = await adminApi.createApiKey('platform', { name: newKeyName, permissions: newKeyPerms });
      setCreatedKey(result.key || result.data?.key || null);
      setNewKeyName('');
      setShowCreate(false);
      fetchKeys();
      addToast('API key created — copy it now, it won\'t be shown again', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create key', 'error');
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this key? It will immediately stop working.')) return;
    try {
      await adminApi.revokeApiKey(id);
      fetchKeys();
      addToast('Key revoked', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to revoke', 'error');
    }
  };

  const rotateKey = async (id: string) => {
    if (!confirm('Rotate this key? The old key will be invalidated.')) return;
    try {
      const result = await adminApi.rotateApiKey(id);
      setCreatedKey(result.key || result.data?.key || null);
      fetchKeys();
      addToast('Key rotated — copy the new key', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to rotate', 'error');
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Permanently delete this key?')) return;
    try {
      await adminApi.deleteApiKey(id);
      fetchKeys();
      addToast('Key deleted', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  };

  const activeCount = keys.filter(k => k.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="API Keys"
        description={`Manage API keys for external integrations (${activeCount} active)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchKeys}><RefreshCw size={14} /></Button>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}><Plus size={14} /> Create Key</Button>
          </div>
        }
      />

      <div className="divider-heavy" />

      {createdKey && (
        <Card padding="md" className="border-success bg-success/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans font-semibold text-sm text-success mb-1">New API Key Created</p>
              <code className="text-xs font-mono bg-ink/5 px-2 py-1 rounded">{createdKey}</code>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(createdKey)}><Copy size={14} /> Copy</Button>
              <Button size="sm" variant="ghost" onClick={() => setCreatedKey(null)}>Dismiss</Button>
            </div>
          </div>
        </Card>
      )}

      {showCreate && (
        <Card padding="md" className="border-accent">
          <p className="font-sans font-semibold text-sm mb-4">Create New API Key</p>
          <input
            type="text"
            placeholder="Key name (e.g. 'Zapier Integration')"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            className="w-full border border-ink/10 rounded-lg px-3 py-2 text-sm font-sans bg-surface mb-4"
          />
          <div className="mb-4">
            <p className="text-caption text-body font-sans mb-2">Permissions</p>
            <div className="flex flex-wrap gap-2">
              {PERMISSION_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setNewKeyPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  className={`px-2 py-1 text-xs font-sans rounded border transition-colors ${
                    newKeyPerms.includes(p) ? 'bg-accent text-white border-accent' : 'bg-surface text-body border-ink/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" onClick={createKey}>Create Key</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Card key={i} className="h-20 animate-pulse" />)}
        </div>
      ) : keys.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Key size={32} className="mx-auto text-body/30 mb-3" />
          <p className="text-body font-sans">No API keys yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map(key => (
            <Card key={key.id} padding="md" className="flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${key.isActive ? 'bg-accent/10 text-accent' : 'bg-ink/5 text-body/40'}`}>
                  <Key size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-sans font-semibold text-sm truncate">{key.name}</p>
                    <StatusBadge status={key.isActive ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <code className="text-xs font-mono text-body/60">
                      {key.keyPrefix}••••••••
                    </code>
                    <span className="text-caption text-body font-sans">
                      {key.permissions.length} permissions
                    </span>
                    {key.lastUsedAt && (
                      <span className="text-caption text-body font-sans">Last used {timeAgo(key.lastUsedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <Button variant="ghost" size="sm" onClick={() => rotateKey(key.id)} title="Rotate"><RotateCw size={14} /></Button>
                {key.isActive && (
                  <Button variant="ghost" size="sm" onClick={() => revokeKey(key.id)} title="Revoke"><EyeOff size={14} /></Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => deleteKey(key.id)} title="Delete" className="text-error"><Trash2 size={14} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
