'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { RefreshCw, TrendingUp, TrendingDown, Users, Building2, CreditCard, BarChart3, Download } from 'lucide-react';

interface PlatformStats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  monthlyOrders: number;
  totalStaff: number;
  activeSubscriptions: number;
  trialTenants: number;
  gracePeriodTenants: number;
  suspendedTenants: number;
  topRestaurants: Array<{ name: string; revenue: number; orders: number }>;
  recentActivity: Array<{ type: string; message: string; timestamp: string }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getPlatformStats();
      setStats(result);
    } catch (err: any) {
      addToast(err.message || 'Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Platform Reports"
        description="Analytics and performance metrics across the entire platform"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchStats}><RefreshCw size={14} /> Refresh</Button>
            <Button variant="outline" size="sm"><Download size={14} /> Export Report</Button>
          </>
        }
      />

      <div className="divider-heavy" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Restaurants" value={stats.totalTenants} change={`${stats.activeTenants} active`} changeType="positive" />
            <StatCard label="Monthly Revenue" value={`₹${(stats.monthlyRevenue || 0).toLocaleString('en-IN')}`} change="+12% vs last month" changeType="positive" />
            <StatCard label="Monthly Orders" value={(stats.monthlyOrders || 0).toLocaleString('en-IN')} change="+8% vs last month" changeType="positive" />
            <StatCard label="Active Subscriptions" value={stats.activeSubscriptions || 0} change={`${stats.trialTenants || 0} in trial`} changeType="neutral" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card padding="md">
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Revenue Trend</h3>
              {stats.revenueByMonth && stats.revenueByMonth.length > 0 ? (
                <div className="space-y-3">
                  {stats.revenueByMonth.slice(-6).map((m) => {
                    const maxRevenue = Math.max(...stats.revenueByMonth.map(r => r.revenue));
                    const width = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="text-caption font-sans w-16 shrink-0">{m.month}</span>
                        <div className="flex-1 h-6 bg-ink/5 relative">
                          <div className="h-full bg-ink transition-all" style={{ width: `${width}%` }} />
                        </div>
                        <span className="text-caption font-sans w-24 text-right">₹{m.revenue.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-body-sm text-body font-sans">No revenue data available yet.</p>
              )}
            </Card>

            {/* Top Restaurants */}
            <Card padding="md">
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Top Restaurants</h3>
              {stats.topRestaurants && stats.topRestaurants.length > 0 ? (
                <div className="space-y-3">
                  {stats.topRestaurants.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-caption font-sans text-body w-5">{i + 1}.</span>
                        <span className="text-body-sm font-sans font-semibold">{r.name}</span>
                      </div>
                      <span className="text-caption font-sans">₹{r.revenue.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-body font-sans">No restaurant data available yet.</p>
              )}
            </Card>

            {/* Subscription Breakdown */}
            <Card padding="md">
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Subscription Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'Active', value: stats.activeSubscriptions || 0, color: 'bg-success' },
                  { label: 'Trial', value: stats.trialTenants || 0, color: 'bg-accent' },
                  { label: 'Grace Period', value: stats.gracePeriodTenants || 0, color: 'bg-warning' },
                  { label: 'Suspended', value: stats.suspendedTenants || 0, color: 'bg-danger' },
                ].map((item) => {
                  const total = (stats.activeSubscriptions || 0) + (stats.trialTenants || 0) + (stats.gracePeriodTenants || 0) + (stats.suspendedTenants || 0);
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-body-sm font-sans">{item.label}</span>
                        <span className="text-caption font-sans text-body">{item.value} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-ink/5">
                        <div className={`h-full ${item.color} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card padding="md">
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Recent Activity</h3>
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 6).map((a, i) => (
                    <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-ink mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-body-sm font-sans truncate">{a.message}</p>
                        <p className="text-caption text-body font-sans">{new Date(a.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-body font-sans">No recent activity.</p>
              )}
            </Card>
          </div>
        </>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-body-sm text-body font-sans">Failed to load platform statistics.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchStats}>Retry</Button>
        </Card>
      )}
    </div>
  );
}
