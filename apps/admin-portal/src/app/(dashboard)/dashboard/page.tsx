'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { WiredChart, wiredBaseOptions, wiredYAxis, WIRED_PALETTE } from '@/components/charts/wired-chart';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import {
  Building2, Users, CreditCard, TrendingUp, AlertTriangle,
  ArrowRight, LifeBuoy, Activity, DollarSign, Clock, Plus, RefreshCw
} from 'lucide-react';
import type { ApexOptions } from 'apexcharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expiringSoon, setExpiringSoon] = useState<any[]>([]);
  const { addToast } = useToastStore();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, expiringRes] = await Promise.all([
        adminApi.getPlatformStats().catch(() => null),
        adminApi.getExpiringSoon(7).catch(() => null),
      ]);
      if (statsRes) setStats(statsRes);
      if (expiringRes) setExpiringSoon(expiringRes.data || expiringRes.subscriptions || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const totalRestaurants = stats?.totalTenants || stats?.totalRestaurants || stats?.tenants?.total || 0;
  const activeSubscriptions = stats?.activeSubscriptions || stats?.subscriptions?.active || 0;
  const totalRevenue = stats?.totalRevenue || stats?.revenue?.total || stats?.mrr || 0;
  const pendingIssues = stats?.pendingIssues || stats?.support?.open || 0;
  const trialCount = stats?.trialTenants || stats?.subscriptions?.trial || 0;
  const graceCount = stats?.gracePeriodTenants || stats?.subscriptions?.grace || 0;
  const suspendedCount = stats?.suspendedTenants || stats?.subscriptions?.suspended || 0;

  const formatRevenue = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val}`;
  };

  const topStatCards = [
    { label: 'Total Restaurants', value: totalRestaurants.toLocaleString('en-IN'), change: 'All registered', changeType: 'neutral' as const },
    { label: 'Active Subscriptions', value: activeSubscriptions.toLocaleString('en-IN'), change: trialCount > 0 ? `${trialCount} in trial` : 'Paid', changeType: 'positive' as const },
    { label: 'Monthly Revenue', value: formatRevenue(totalRevenue), change: 'MRR', changeType: 'positive' as const },
    { label: 'Pending Issues', value: String(pendingIssues), change: pendingIssues > 0 ? 'Needs attention' : 'All clear', changeType: (pendingIssues > 0 ? 'negative' : 'positive') as 'negative' | 'positive' },
  ];

  // Build subscription donut from real data
  const donutSeries = [activeSubscriptions, trialCount, graceCount, suspendedCount].some(v => v > 0)
    ? [activeSubscriptions, trialCount, graceCount, suspendedCount]
    : [0, 0, 0, 0];
  const donutTotal = donutSeries.reduce((a, b) => a + b, 0);

  const subscriptionDonut = {
    series: donutSeries,
    options: {
      ...wiredBaseOptions,
      chart: { ...wiredBaseOptions.chart, type: 'donut' as const },
      colors: WIRED_PALETTE.slice(0, 4),
      labels: ['Active', 'Trial', 'Grace Period', 'Suspended'],
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500, color: '#737373' },
              value: { show: true, fontSize: '24px', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, color: '#000000' },
              total: {
                show: true, label: 'Total', fontSize: '12px', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500, color: '#737373',
                formatter: () => donutTotal.toLocaleString('en-IN'),
              },
            },
          },
        },
      },
      stroke: { width: 2, colors: ['#ffffff'] },
      legend: { ...wiredBaseOptions.legend, position: 'bottom' as const },
      tooltip: { ...wiredBaseOptions.tooltip, y: { formatter: (val: number) => val.toLocaleString('en-IN') } },
    } as ApexOptions,
  };

  // Recent activity from audit logs or stats
  const recentActivity = stats?.recentActivity || stats?.activity || [];

  const systemHealth = [
    { name: 'API Server', status: 'Operational', uptime: '99.98%' },
    { name: 'Database', status: 'Operational', uptime: '99.99%' },
    { name: 'Redis Cache', status: 'Operational', uptime: '100%' },
    { name: 'Background Jobs', status: 'Operational', uptime: '99.9%' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command Center"
        title="Dashboard"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchDashboard}><RefreshCw size={14} /> Refresh</Button>
            <Link href="/provision" className="btn btn-primary btn-sm"><Plus size={14} />Create Restaurant</Link>
            <Link href="/support" className="btn btn-outline btn-sm"><LifeBuoy size={14} />Support</Link>
          </>
        }
      />
      <div className="divider-heavy" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topStatCards.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display-xs font-sans">Subscriptions</h2>
          </div>
          {loading ? (
            <div className="h-[280px] animate-pulse bg-hairline/30" />
          ) : donutTotal === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-body-sm text-body font-sans">No subscriptions yet. Provision a restaurant to get started.</p>
            </div>
          ) : (
            <WiredChart options={subscriptionDonut.options} series={subscriptionDonut.series} type="donut" height={280} />
          )}
        </Card>
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-display-xs font-sans">Recent Activity</h2>
              <Link href="/audit-logs" className="text-caption font-sans font-semibold text-link hover:underline">View All</Link>
            </div>
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-hairline">
                {recentActivity.slice(0, 8).map((item: any, i: number) => (
                  <div key={item.id || i} className="flex items-start gap-3 py-3">
                    <div className="mt-0.5 text-body shrink-0">
                      {item.type === 'signup' || item.action?.includes('tenant') ? <Building2 size={14} /> :
                       item.type === 'payment' || item.action?.includes('payment') ? <DollarSign size={14} /> :
                       item.type === 'support' || item.action?.includes('ticket') ? <LifeBuoy size={14} /> :
                       item.type === 'subscription' || item.action?.includes('subscription') ? <CreditCard size={14} /> :
                       <AlertTriangle size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-sans truncate">{item.message || item.details || item.description || item.action || 'Event'}</p>
                      <p className="text-caption text-body font-sans flex items-center gap-1 mt-0.5">
                        <Clock size={10} />{item.time || item.timestamp || item.createdAt || ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-body-sm text-body font-sans">No recent activity. Actions will appear here as they occur.</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display-xs font-sans">System Health</h2>
            <Link href="/monitoring" className="text-caption font-sans font-semibold text-link hover:underline">Details</Link>
          </div>
          <div className="space-y-3">
            {systemHealth.map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${service.status === 'Operational' ? 'bg-success' : 'bg-warning'}`} />
                  <span className="text-body-sm font-sans">{service.name}</span>
                </div>
                <span className="text-caption text-body font-sans">{service.uptime}</span>
              </div>
            ))}
          </div>
        </Card>

        {expiringSoon.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-display-xs font-sans">Expiring Soon</h2>
              <Link href="/subscriptions" className="text-caption font-sans font-semibold text-link hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {expiringSoon.slice(0, 5).map((sub: any) => (
                <div key={sub.id || sub.tenantId} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-body-sm font-sans font-medium truncate">{sub.restaurantName || sub.tenantName || sub.tenantId}</p>
                    <p className="text-caption text-body font-sans">Expires: {sub.expiresAt || sub.endDate || '—'}</p>
                  </div>
                  <Badge variant="outline">Expiring</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-display-xs font-sans mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/provision" className="btn btn-primary btn-sm w-full justify-start"><Plus size={14} />Create Restaurant</Link>
            <Link href="/tenants" className="btn btn-outline btn-sm w-full justify-start"><Building2 size={14} />Manage Restaurants</Link>
            <Link href="/subscriptions" className="btn btn-outline btn-sm w-full justify-start"><CreditCard size={14} />View Subscriptions</Link>
            <Link href="/settings" className="btn btn-outline btn-sm w-full justify-start"><Activity size={14} />Platform Settings</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
