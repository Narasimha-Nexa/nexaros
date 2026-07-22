'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/website-primitives';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import {
  GitBranch, Plus, RefreshCw, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronRight, Trash2, Pencil, Play, Loader2,
} from 'lucide-react';

interface WorkflowStep {
  name: string;
  approverRole: string;
  action?: 'none' | 'notify' | 'webhook' | 'status_change';
  actionConfig?: Record<string, any>;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string | null;
  entityType: string;
  triggerEvent: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
}

interface WorkflowRequest {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  requestData: any;
  currentStep: number;
  status: string;
  decision: string | null;
  notes: string | null;
  createdAt: string;
  executionLog?: Array<{ step: number; action: string; status: string; error?: string; result?: any }>;
  template?: { name: string; steps: WorkflowStep[] };
}

const ROLE_OPTIONS = [
  { value: 'ANY', label: 'Anyone' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'KITCHEN', label: 'Kitchen' },
];

const ACTION_OPTIONS = [
  { value: 'none', label: 'No action' },
  { value: 'notify', label: 'Send notification' },
  { value: 'webhook', label: 'Call webhook' },
  { value: 'status_change', label: 'Change status' },
];

const EMPTY_STEP: WorkflowStep = { name: '', approverRole: 'MANAGER', action: 'none', actionConfig: {} };

export default function WorkflowsPage() {
  const [tenantId, setTenantId] = useState<string>('');
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [requests, setRequests] = useState<WorkflowRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'requests' | 'templates'>('requests');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WorkflowTemplate | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', entityType: 'order', triggerEvent: '', isActive: true,
    steps: [{ ...EMPTY_STEP }] as WorkflowStep[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.listTenants({ limit: '100' })
      .then((r: any) => {
        const items = (r?.data || r || []) as any[];
        const mapped = items.map((t: any) => ({ id: t.id, name: t.name || t.restaurantName || t.tenantName || t.id }));
        setTenants(mapped);
        if (mapped.length && !tenantId) setTenantId(mapped[0].id);
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [templatesRes, requestsRes, statsRes] = await Promise.allSettled([
        adminApi.listWorkflowTemplates(tenantId),
        adminApi.listWorkflowRequests(tenantId, statusFilter !== 'all' ? { status: statusFilter } : {}),
        adminApi.getWorkflowStats(tenantId),
      ]);
      setTemplates(templatesRes.status === 'fulfilled' ? (templatesRes.value?.data || templatesRes.value || []) : []);
      setRequests(requestsRes.status === 'fulfilled' ? (requestsRes.value?.data || requestsRes.value || []) : []);
      setStats(statsRes.status === 'fulfilled' ? statsRes.value?.data || statsRes.value : null);
    } finally {
      setLoading(false);
    }
  }, [tenantId, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (tab !== 'requests' || !tenantId) return;
    const t = setInterval(fetchData, 15000);
    return () => clearInterval(t);
  }, [tab, tenantId, fetchData]);

  const approveRequest = async (id: string) => {
    if (!tenantId) return;
    try {
      await adminApi.approveWorkflowRequest(tenantId, id, { decision: 'approved', comment: 'Approved by admin' });
      fetchData();
      addToast('Request approved', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to approve', 'error');
    }
  };

  const rejectRequest = async (id: string) => {
    if (!tenantId) return;
    const comment = prompt('Rejection reason:');
    if (comment === null) return;
    try {
      await adminApi.rejectWorkflowRequest(tenantId, id, comment || 'Rejected by admin');
      fetchData();
      addToast('Request rejected', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to reject', 'error');
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', entityType: 'order', triggerEvent: '', isActive: true, steps: [{ ...EMPTY_STEP }] });
    setEditorOpen(true);
  };

  const openEdit = (tpl: WorkflowTemplate) => {
    setEditing(tpl);
    setForm({
      name: tpl.name, description: tpl.description || '', entityType: tpl.entityType,
      triggerEvent: tpl.triggerEvent, isActive: tpl.isActive, steps: tpl.steps?.length ? tpl.steps : [{ ...EMPTY_STEP }],
    });
    setEditorOpen(true);
  };

  const saveTemplate = async () => {
    if (!tenantId) return;
    if (!form.name.trim()) { addToast('Name is required', 'error'); return; }
    if (!form.steps.length || form.steps.some(s => !s.name.trim())) {
      addToast('Every step needs a name', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name, description: form.description, entityType: form.entityType,
        triggerEvent: form.triggerEvent, isActive: form.isActive, steps: form.steps,
      };
      if (editing) {
        await adminApi.updateWorkflowTemplate(tenantId, editing.id, payload);
        addToast('Template updated', 'success');
      } else {
        await adminApi.createWorkflowTemplate(tenantId, payload);
        addToast('Template created', 'success');
      }
      setEditorOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!tenantId || !confirm('Delete this template?')) return;
    try {
      await adminApi.deleteWorkflowTemplate(tenantId, id);
      addToast('Template deleted', 'success');
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete', 'error');
    }
  };

  const toggleActive = async (tpl: WorkflowTemplate) => {
    if (!tenantId) return;
    try {
      await adminApi.updateWorkflowTemplate(tenantId, tpl.id, { isActive: !tpl.isActive });
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update', 'error');
    }
  };

  const updateStep = (idx: number, patch: Partial<WorkflowStep>) => {
    setForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, ...patch } : s) }));
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={14} className="text-success" />;
      case 'rejected': return <XCircle size={14} className="text-error" />;
      case 'pending': return <Clock size={14} className="text-warning" />;
      default: return <Clock size={14} className="text-body/40" />;
    }
  };

  const stepStatusColor = (s: string) => s === 'executed' ? 'text-success' : s === 'failed' ? 'text-error' : 'text-body/50';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Automation"
        title="Workflows & Approvals"
        description="Design approval workflows and review pending requests"
        actions={<Button variant="outline" size="sm" onClick={fetchData}><RefreshCw size={14} /> Refresh</Button>}
      />

      <div className="flex items-center gap-3">
        <label className="text-caption text-body font-sans">Tenant</label>
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="border border-ink/15 rounded-md px-3 py-1.5 text-sm font-sans bg-surface"
        >
          {tenants.length === 0 && <option value="">No tenants</option>}
          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="divider-heavy" />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', value: stats.pending || 0, color: 'text-warning' },
            { label: 'Approved (30d)', value: stats.approved || 0, color: 'text-success' },
            { label: 'Rejected (30d)', value: stats.rejected || 0, color: 'text-error' },
            { label: 'Templates', value: templates.length, color: 'text-accent' },
          ].map(s => (
            <Card key={s.label} padding="sm" className="text-center">
              <p className={`text-2xl font-sans font-bold ${s.color}`}>{s.value}</p>
              <p className="text-caption text-body font-sans mt-1">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-ink/5 rounded-lg p-1 w-fit">
          {(['requests', 'templates'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-sans rounded-md transition-colors capitalize ${
                tab === t ? 'bg-surface shadow-sm font-semibold' : 'text-body/60 hover:text-body'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'templates' && tenantId && (
          <Button size="sm" onClick={openCreate}><Plus size={14} /> New Template</Button>
        )}
      </div>

      {tab === 'requests' && (
        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-sans rounded-full border transition-colors capitalize ${
                statusFilter === s ? 'bg-accent text-white border-accent' : 'bg-surface text-body border-ink/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Card key={i} className="h-20 animate-pulse" />)}
        </div>
      ) : tab === 'requests' ? (
        requests.length === 0 ? (
          <Card padding="lg" className="text-center">
            <GitBranch size={32} className="mx-auto text-body/30 mb-3" />
            <p className="text-body font-sans">No {statusFilter === 'all' ? '' : statusFilter + ' '}workflow requests.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <Card key={req.id} padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcon(req.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-sans font-semibold text-sm">
                          {req.template?.name || `${req.entityType} — ${req.action}`}
                        </p>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-caption text-body font-sans mt-0.5">
                        {req.entityType}/{req.entityId} • Step {req.currentStep}
                        {req.template?.steps?.length ? `/${req.template.steps.length}` : ''} • {timeAgo(req.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => approveRequest(req.id)} className="bg-success text-white">Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectRequest(req.id)} className="text-error border-error">Reject</Button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}
                      className="text-body/40 hover:text-body"
                    >
                      {expandedRequest === req.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
                {expandedRequest === req.id && (
                  <div className="mt-3 space-y-3">
                    {req.requestData && (
                      <pre className="p-3 bg-ink/5 rounded text-xs font-mono text-body/70 overflow-x-auto">
                        {JSON.stringify(req.requestData, null, 2)}
                      </pre>
                    )}
                    {req.notes && (
                      <p className="text-caption text-body font-sans"><span className="font-semibold">Notes:</span> {req.notes}</p>
                    )}
                    {req.executionLog?.length ? (
                      <div>
                        <p className="text-caption font-sans font-semibold mb-1">Execution Log</p>
                        <div className="space-y-1">
                          {req.executionLog.map((e, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs font-mono">
                              <span className="text-body/50">step {e.step}</span>
                              <span className="text-body/70">{e.action}</span>
                              <span className={stepStatusColor(e.status)}>{e.status}</span>
                              {e.error && <span className="text-error truncate max-w-[280px]">{e.error}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-caption text-body/50 font-sans">No execution log yet.</p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        templates.length === 0 ? (
          <Card padding="lg" className="text-center">
            <GitBranch size={32} className="mx-auto text-body/30 mb-3" />
            <p className="text-body font-sans">No workflow templates configured.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {templates.map(tpl => (
              <Card key={tpl.id} padding="md" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-accent/10 text-accent shrink-0">
                    <GitBranch size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-sans font-semibold text-sm">{tpl.name}</p>
                      <StatusBadge status={tpl.isActive ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-caption text-body font-sans">
                      {tpl.entityType} • Trigger: {tpl.triggerEvent} • {(tpl.steps || []).length} steps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={tpl.isActive} onChange={() => toggleActive(tpl)} />
                  <Button size="sm" variant="ghost" onClick={() => openEdit(tpl)}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-error" onClick={() => deleteTemplate(tpl.id)}><Trash2 size={14} /></Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} title={editing ? 'Edit Template' : 'New Workflow Template'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption font-sans">Name</label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Refund Approval" />
            </div>
            <div>
              <label className="text-caption font-sans">Entity Type</label>
              <Input value={form.entityType} onChange={(e) => setForm(f => ({ ...f, entityType: e.target.value }))} placeholder="order" />
            </div>
          </div>
          <div>
            <label className="text-caption font-sans">Trigger Event</label>
            <Input value={form.triggerEvent} onChange={(e) => setForm(f => ({ ...f, triggerEvent: e.target.value }))} placeholder="order.refund_requested" />
          </div>
          <div>
            <label className="text-caption font-sans">Description</label>
            <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional" />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-caption font-sans font-semibold">Active</label>
            <Switch checked={form.isActive} onChange={(v: boolean) => setForm(f => ({ ...f, isActive: v }))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-caption font-sans font-semibold">Steps</label>
              <Button size="sm" variant="outline" onClick={() => setForm(f => ({ ...f, steps: [...f.steps, { ...EMPTY_STEP }] }))}>
                <Plus size={12} /> Add Step
              </Button>
            </div>
            <div className="space-y-3">
              {form.steps.map((step, idx) => (
                <div key={idx} className="border border-ink/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-caption font-sans font-semibold">Step {idx + 1}</span>
                    {form.steps.length > 1 && (
                      <button
                        className="text-error text-xs"
                        onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={step.name} onChange={(e) => updateStep(idx, { name: e.target.value })} placeholder="Step name" />
                    <Select value={step.approverRole} onChange={(e) => updateStep(idx, { approverRole: e.target.value })} options={ROLE_OPTIONS} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={step.action || 'none'}
                      onChange={(e) => updateStep(idx, { action: e.target.value as any })}
                      options={ACTION_OPTIONS}
                    />
                    {step.action === 'status_change' && (
                      <Input
                        value={step.actionConfig?.value || ''}
                        onChange={(e) => updateStep(idx, { actionConfig: { ...step.actionConfig, value: e.target.value, field: step.actionConfig?.field || 'status' } })}
                        placeholder="status value (e.g. REFUNDED)"
                      />
                    )}
                    {step.action === 'webhook' && (
                      <Input
                        value={step.actionConfig?.url || ''}
                        onChange={(e) => updateStep(idx, { actionConfig: { ...step.actionConfig, url: e.target.value } })}
                        placeholder="https://..."
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />} {editing ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
