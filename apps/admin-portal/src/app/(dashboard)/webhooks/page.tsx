'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { Webhook, Plus, RefreshCw, Trash2, ExternalLink, Send, CheckCircle, XCircle, Clock } from 'lucide-react';

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  _count?: { deliveries: number };
}

const EVENT_OPTIONS = [
  'order.created', 'order.updated', 'order.status_changed', 'order.ready',
  'menu.updated', 'table.status_changed', 'payment.received', 'payment.refunded',
  'reservation.created', 'reservation.updated', 'reservation.deleted',
  'staff.updated', 'inventory.updated', 'inventory.low_stock',
  'invoice.generated', 'subscription.status_changed',
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['order.created']);
  const [selectedDeliveries, setSelectedDeliveries] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const { addToast } = useToastStore();

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const result = await adminApi.listWebhooks('platform');
      setWebhooks(result.data || result || []);
    } catch {
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWebhooks(); }, []);

  const createWebhook = async () => {
    if (!newName.trim() || !newUrl.trim()) { addToast('Name and URL required', 'error'); return; }
    try {
      await adminApi.createWebhook('platform', { name: newName, url: newUrl, events: newEvents });
      setShowCreate(false);
      setNewName('');
      setNewUrl('');
      fetchWebhooks();
      addToast('Webhook created', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create webhook', 'error');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await adminApi.updateWebhook(id, { isActive: !isActive });
      fetchWebhooks();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const testWebhook = async (id: string) => {
    try {
      await adminApi.testWebhook(id);
      addToast('Test event sent', 'success');
    } catch (err: any) {
      addToast(err.message || 'Test failed', 'error');
    }
  };

  const viewDeliveries = async (id: string) => {
    setSelectedDeliveries(id);
    try {
      const result = await adminApi.getWebhookDeliveries(id);
      setDeliveries(result.data || result || []);
    } catch {
      setDeliveries([]);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook?')) return;
    try {
      await adminApi.deleteWebhook(id);
      fetchWebhooks();
      addToast('Webhook deleted', 'success');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const activeCount = webhooks.filter(w => w.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Integrations"
        title="Outbound Webhooks"
        description={`Push real-time events to external services (${activeCount} active)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchWebhooks}><RefreshCw size={14} /></Button>
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}><Plus size={14} /> Add Webhook</Button>
          </div>
        }
      />

      <div className="divider-heavy" />

      {showCreate && (
        <Card padding="md" className="border-accent">
          <p className="font-sans font-semibold text-sm mb-4">New Webhook</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Name (e.g. Slack Notifications)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="border border-ink/10 rounded-lg px-3 py-2 text-sm font-sans bg-surface"
            />
            <input
              type="url"
              placeholder="Endpoint URL (https://...)"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              className="border border-ink/10 rounded-lg px-3 py-2 text-sm font-sans bg-surface"
            />
          </div>
          <div className="mb-4">
            <p className="text-caption text-body font-sans mb-2">Events</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map(evt => (
                <button
                  key={evt}
                  onClick={() => setNewEvents(prev => prev.includes(evt) ? prev.filter(x => x !== evt) : [...prev, evt])}
                  className={`px-2 py-1 text-xs font-sans rounded border transition-colors ${
                    newEvents.includes(evt) ? 'bg-accent text-white border-accent' : 'bg-surface text-body border-ink/10'
                  }`}
                >
                  {evt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" onClick={createWebhook}>Create Webhook</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Card key={i} className="h-20 animate-pulse" />)}
        </div>
      ) : webhooks.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Webhook size={32} className="mx-auto text-body/30 mb-3" />
          <p className="text-body font-sans">No webhooks configured. Add one to start receiving events.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <Card key={wh.id} padding="md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${wh.isActive ? 'bg-success/10 text-success' : 'bg-ink/5 text-body/40'}`}>
                    <Webhook size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-sans font-semibold text-sm">{wh.name}</p>
                      <StatusBadge status={wh.isActive ? 'active' : 'inactive'} />
                    </div>
                    <code className="text-xs font-mono text-body/60 flex items-center gap-1">
                      {wh.url} <ExternalLink size={10} />
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(wh.id, wh.isActive)} title={wh.isActive ? 'Disable' : 'Enable'}>
                    {wh.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => testWebhook(wh.id)} title="Send test"><Send size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => viewDeliveries(wh.id)} title="Delivery history">
                    {wh._count?.deliveries || 0}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteWebhook(wh.id)} className="text-error" title="Delete"><Trash2 size={14} /></Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {wh.events.map(evt => (
                  <span key={evt} className="px-2 py-0.5 text-xs font-mono bg-ink/5 rounded text-body/70">{evt}</span>
                ))}
              </div>

              {selectedDeliveries === wh.id && deliveries.length > 0 && (
                <div className="mt-4 border-t border-ink/10 pt-4">
                  <p className="text-caption font-sans mb-2">Recent Deliveries</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {deliveries.slice(0, 10).map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between text-xs font-sans">
                        <div className="flex items-center gap-2">
                          {d.status === 'success' ? <CheckCircle size={12} className="text-success" /> :
                           d.status === 'failed' ? <XCircle size={12} className="text-error" /> :
                           <Clock size={12} className="text-body/40" />}
                          <span className="text-body/70">{d.event}</span>
                          <span className="text-body/40">{d.statusCode || '—'}</span>
                        </div>
                        <span className="text-body/40">{timeAgo(d.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
