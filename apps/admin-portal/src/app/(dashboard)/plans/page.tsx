'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Tag, Plus, Edit, Check, X, Crown, Star, Zap, Building2, RefreshCw } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billingCycle: string;
  maxBranches: number;
  maxStaff: number;
  trialDays: number;
  entitlements?: Record<string, boolean>;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  trial: <Zap size={20} />,
  starter: <Star size={20} />,
  professional: <Crown size={20} />,
  enterprise: <Building2 size={20} />,
  'starter-free': <Star size={20} />,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0 });
  const [modules, setModules] = useState<{ key: string; name: string; description: string }[]>([]);
  const [entitlementDraft, setEntitlementDraft] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const { addToast } = useToastStore();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getPlans();
      setPlans(result.plans || result.data || result || []);
    } catch (err: any) {
      addToast(err.message || 'Failed to load plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const openEditor = async (plan: Plan) => {
    setEditingPlan(plan);
    setEditForm({ name: plan.name, price: plan.price });
    setEntitlementDraft({ ...(plan.entitlements || {}) });
    try {
      const mods = await adminApi.getModuleKeys();
      setModules(Array.isArray(mods) ? mods : (mods.modules || []));
    } catch {
      setModules([]);
    }
  };

  const toggleEntitlement = (key: string) =>
    setEntitlementDraft((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      await adminApi.updatePlanPrice(editingPlan.id, editForm.price);
      await adminApi.updatePlanEntitlements(editingPlan.id, entitlementDraft);
      addToast('Plan updated successfully', 'success');
      setEditingPlan(null);
      fetchPlans();
    } catch (err: any) {
      addToast(err.message || 'Failed to update plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Subscription Plans"
        description="Manage plans and entitlements for restaurants"
        actions={<Button variant="outline" size="sm" onClick={fetchPlans}><RefreshCw size={14} /> Refresh</Button>}
      />
      <div className="divider-heavy" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="h-64 animate-pulse" />)}
        </div>
      ) : plans.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-body-sm text-body font-sans">No plans found. Plans are created via database seed.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const icon = PLAN_ICONS[plan.slug] || PLAN_ICONS[plan.name?.toLowerCase()] || <Tag size={20} />;
            const isEnterprise = plan.slug === 'enterprise' || plan.name?.toLowerCase() === 'enterprise';
            const isPopular = plan.slug === 'professional' || plan.name?.toLowerCase() === 'professional';
            return (
              <Card key={plan.id} variant={isEnterprise || isPopular ? 'elevated' : 'default'} className={`border-2 ${isEnterprise || isPopular ? 'border-ink' : 'border-hairline'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-display-xs font-sans">{plan.name}</h3>
                  </div>
                  <button onClick={() => openEditor(plan)} className="btn-ghost btn-sm p-1.5">
                    <Edit size={14} />
                  </button>
                </div>
                <div className="mb-4">
                  <span className="text-display-md font-display">{plan.price === 0 ? 'Free' : formatCurrency(plan.price)}</span>
                  {plan.price > 0 && <span className="text-body-sm text-body font-sans">/{plan.billingCycle?.toLowerCase() || 'mo'}</span>}
                </div>
                <div className="divider mb-4" />
                <ul className="space-y-2">
                  {(plan.entitlements ? Object.entries(plan.entitlements).filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' ')) : []).slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-body-sm font-sans">
                      <Check size={14} className="shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-hairline">
                  <div className="flex items-center justify-between text-caption text-body font-sans">
                    <span>{plan.maxBranches === 1 ? '1 Branch' : `${plan.maxBranches || '∞'} Branches`}</span>
                    <span>{plan.trialDays || 0}d trial</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editingPlan} onClose={() => setEditingPlan(null)} title={`Edit ${editingPlan?.name || ''} Plan`} size="lg">
        {editingPlan && (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Plan Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <Input label="Price (₹)" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} />
            </div>

            <div>
              <p className="text-body-sm font-sans font-semibold mb-2">Module Entitlements</p>
              <p className="text-caption font-sans text-body mb-3">Toggle which modules are included in this plan. Saved instantly with the plan.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {modules.length === 0 ? (
                  <p className="text-caption font-sans text-body">Loading modules…</p>
                ) : (
                  modules.map((m) => {
                    const enabled = !!entitlementDraft[m.key];
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleEntitlement(m.key)}
                        className={`flex items-center justify-between gap-2 border-2 px-3 py-2 text-left transition-colors ${
                          enabled ? 'border-ink bg-ink/5' : 'border-hairline hover:border-ink/40'
                        }`}
                      >
                        <span>
                          <span className="block text-body-sm font-sans font-semibold">{m.name}</span>
                          <span className="block text-caption font-sans text-body">{m.description}</span>
                        </span>
                        <span className={`w-5 h-5 flex items-center justify-center border-2 ${enabled ? 'bg-ink text-canvas border-ink' : 'border-hairline'}`}>
                          {enabled && <Check size={12} />}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancel</Button>
              <Button onClick={handleSave} isLoading={saving}>Save Changes</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
