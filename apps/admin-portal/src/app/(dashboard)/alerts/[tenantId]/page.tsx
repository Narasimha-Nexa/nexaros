'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, Info, XCircle, Lightbulb, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';

const TYPE_META: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  critical: { icon: <XCircle size={18} />, cls: 'text-error', label: 'Critical' },
  warning: { icon: <AlertTriangle size={18} />, cls: 'text-warning', label: 'Warning' },
  info: { icon: <Info size={18} />, cls: 'text-link', label: 'Info' },
  success: { icon: <CheckCircle2 size={18} />, cls: 'text-success', label: 'Positive' },
};

export default function AlertCenterPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const { addToast } = useToastStore();

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAiInsights(tenantId);
      setInsights(res?.data?.insights ?? []);
    } catch (err: any) {
      addToast(err?.message || 'Failed to load alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tenantId]);

  const filtered = useMemo(
    () => (filter === 'all' ? insights : insights.filter((i) => i.type === filter)),
    [insights, filter],
  );

  const counts = useMemo(() => ({
    critical: insights.filter((i) => i.type === 'critical').length,
    warning: insights.filter((i) => i.type === 'warning').length,
    info: insights.filter((i) => i.type === 'info' || i.type === 'success').length,
  }), [insights]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Alert Center"
        description="AI-detected operational alerts for this restaurant."
        actions={<Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { key: 'critical', label: 'Critical', value: counts.critical, cls: 'text-error' },
          { key: 'warning', label: 'Warnings', value: counts.warning, cls: 'text-warning' },
          { key: 'info', label: 'Info', value: counts.info, cls: 'text-link' },
        ].map((s) => (
          <Card key={s.key} padding="sm" className="text-center cursor-pointer" onClick={() => setFilter(s.key as any)}>
            <p className={`text-2xl font-sans font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-caption text-body font-sans mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs font-sans rounded-full border transition-colors capitalize ${
              filter === f ? 'bg-accent text-white border-accent' : 'bg-surface text-body border-ink/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Card key={i} className="h-20 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Lightbulb size={32} className="mx-auto text-body/30 mb-3" />
          <p className="text-body font-sans">No {filter === 'all' ? '' : filter + ' '}alerts. All clear.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const meta = TYPE_META[a.type] ?? TYPE_META.info;
            return (
              <Card key={a.id} padding="md" className="flex items-start gap-3">
                <span className={meta.cls}>{meta.icon}</span>
                <div>
                  <p className="font-sans font-semibold text-sm text-ink flex items-center gap-2">
                    {a.title} <span className="text-caption text-body/60">· {meta.label}</span>
                  </p>
                  <p className="text-caption text-body font-sans mt-0.5">{a.message}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
