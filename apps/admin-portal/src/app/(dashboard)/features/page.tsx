'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { RefreshCw, ToggleLeft, ToggleRight, Puzzle, Zap, Lock } from 'lucide-react';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const MODULE_KEYS = [
  'pos', 'kitchen', 'orders', 'tables', 'inventory', 'staff', 'shifts', 'attendance',
  'payments', 'invoices', 'reports', 'ai_analytics', 'crm', 'loyalty', 'qr_ordering',
  'customer_website', 'reservations', 'multi_branch', 'api_access', 'white_label', 'priority_support',
];

const MODULE_CATEGORIES: Record<string, string[]> = {
  'Core Operations': ['pos', 'kitchen', 'orders', 'tables', 'payments', 'invoices'],
  'Staff & HR': ['staff', 'shifts', 'attendance'],
  'Inventory & Supply': ['inventory'],
  'Growth & Marketing': ['crm', 'loyalty', 'qr_ordering', 'customer_website', 'reservations'],
  'Analytics & Intelligence': ['reports', 'ai_analytics'],
  'Platform': ['multi_branch', 'api_access', 'white_label', 'priority_support'],
};

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getFeatureFlags();
      const flags = result.data || result || [];
      setFeatures(Array.isArray(flags) ? flags : MODULE_KEYS.map(key => ({
        key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: `Enable ${key.replace(/_/g, ' ')} module`,
        enabled: flags[key] ?? false,
        category: Object.entries(MODULE_CATEGORIES).find(([, keys]) => keys.includes(key))?.[0] || 'Other',
      })));
    } catch {
      setFeatures(MODULE_KEYS.map(key => ({
        key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        description: `Enable ${key.replace(/_/g, ' ')} module`,
        enabled: false,
        category: Object.entries(MODULE_CATEGORIES).find(([, keys]) => keys.includes(key))?.[0] || 'Other',
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeatures(); }, []);

  const toggleFeature = async (key: string, enabled: boolean) => {
    setToggling(key);
    try {
      await adminApi.toggleFeatureFlag(key, enabled);
      setFeatures(prev => prev.map(f => f.key === key ? { ...f, enabled } : f));
      addToast(`Feature ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to toggle feature', 'error');
    } finally {
      setToggling(null);
    }
  };

  const enabledCount = features.filter(f => f.enabled).length;
  const categories = Object.entries(MODULE_CATEGORIES);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform"
        title="Feature Flags"
        description={`Control which modules are available across the platform (${enabledCount}/${features.length} enabled)`}
        actions={<Button variant="outline" size="sm" onClick={fetchFeatures}><RefreshCw size={14} /> Refresh</Button>}
      />

      <div className="divider-heavy" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} padding="sm"><div className="skeleton h-8 w-24 mb-2" /><div className="skeleton h-4 w-full" /></Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(([category, keys]) => (
            <div key={category}>
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {keys.map(key => {
                  const feature = features.find(f => f.key === key);
                  if (!feature) return null;
                  return (
                    <Card key={key} padding="sm" className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${feature.enabled ? 'bg-success/10 text-success' : 'bg-ink/5 text-body'}`}>
                          {feature.enabled ? <Zap size={14} /> : <Lock size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans font-semibold text-sm truncate">{feature.name}</p>
                          <p className="text-caption text-body font-sans truncate">{feature.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFeature(key, !feature.enabled)}
                        disabled={toggling === key}
                        className="shrink-0 ml-3"
                        title={feature.enabled ? 'Disable' : 'Enable'}
                      >
                        {feature.enabled ? (
                          <ToggleRight size={28} className="text-success" />
                        ) : (
                          <ToggleLeft size={28} className="text-body" />
                        )}
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
