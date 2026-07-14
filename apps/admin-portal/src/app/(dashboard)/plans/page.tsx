'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Tag, Plus, Edit, Check, X, Crown, Star, Zap, Building2 } from 'lucide-react';

const defaultPlans = [
  { id: 'trial', name: 'Trial', price: 0, period: '14 days', features: ['POS', 'Orders', 'Basic Reports'], icon: <Zap size={20} />, color: 'border-body' },
  { id: 'starter', name: 'Starter', price: 1499, period: '/month', features: ['POS', 'Orders', 'Kitchen', 'Tables', 'Basic Reports', '1 Branch'], icon: <Star size={20} />, color: 'border-body' },
  { id: 'professional', name: 'Professional', price: 4999, period: '/month', features: ['All Starter', 'Inventory', 'Staff', 'CRM', 'Advanced Reports', '3 Branches'], icon: <Crown size={20} />, color: 'border-ink' },
  { id: 'enterprise', name: 'Enterprise', price: 14999, period: '/month', features: ['All Professional', 'AI Analytics', 'API Access', 'White Label', 'Priority Support', 'Unlimited Branches'], icon: <Building2 size={20} />, color: 'border-ink' },
];

export default function PlansPage() {
  const [plans, setPlans] = useState(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const { addToast } = useToastStore();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Subscription Plans"
        description="Manage plans and entitlements for restaurants"
      />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} variant={plan.id === 'enterprise' || plan.id === 'professional' ? 'elevated' : 'default'} className={`border-2 ${plan.color}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {plan.icon}
                <h3 className="text-display-xs font-sans">{plan.name}</h3>
              </div>
              <button onClick={() => setEditingPlan(plan)} className="btn-ghost btn-sm p-1.5">
                <Edit size={14} />
              </button>
            </div>
            <div className="mb-4">
              <span className="text-display-md font-display">{plan.price === 0 ? 'Free' : formatCurrency(plan.price)}</span>
              {plan.price > 0 && <span className="text-body-sm text-body font-sans">{plan.period}</span>}
            </div>
            <div className="divider mb-4" />
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-body-sm font-sans">
                  <Check size={14} className="shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-hairline">
              <div className="flex items-center justify-between text-caption text-body font-sans">
                <span>Active tenants</span>
                <span className="text-ink font-semibold">{plan.id === 'trial' ? '491' : plan.id === 'starter' ? '856' : plan.id === 'professional' ? '1,100' : '12'}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingPlan} onClose={() => setEditingPlan(null)} title={`Edit ${editingPlan?.name || ''} Plan`}>
        {editingPlan && (
          <div className="space-y-4">
            <Input label="Plan Name" defaultValue={editingPlan.name} />
            <Input label="Price (₹)" type="number" defaultValue={editingPlan.price} />
            <Input label="Billing Period" defaultValue={editingPlan.period} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancel</Button>
              <Button onClick={() => { addToast('Plan updated', 'success'); setEditingPlan(null); }}>Save Changes</Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
