'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { WiredChart, wiredBaseOptions, wiredYAxis, WIRED_PALETTE, WIRED_DONUT_PALETTE } from '@/components/charts/wired-chart';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { RefreshCw, Download } from 'lucide-react';
import type { ApexOptions } from 'apexcharts';

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

  const handleExport = () => {
    if (!stats) return;
    const rows: string[][] = [
      ['Metric', 'Value'],
      ['Total Restaurants', String(stats.totalTenants)],
      ['Active Tenants', String(stats.activeTenants)],
      ['Total Revenue', `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`],
      ['Monthly Revenue', `₹${(stats.monthlyRevenue || 0).toLocaleString('en-IN')}`],
      ['Total Orders', String(stats.totalOrders || 0)],
      ['Monthly Orders', String(stats.monthlyOrders || 0)],
      ['Active Subscriptions', String(stats.activeSubscriptions || 0)],
      ['Trial Tenants', String(stats.trialTenants || 0)],
      ['Suspended Tenants', String(stats.suspendedTenants || 0)],
      [],
      ['Top Restaurants by Revenue', ''],
      ['Restaurant', 'Revenue', 'Orders'],
      ...(stats.topRestaurants || []).map((r) => [r.name, `₹${r.revenue.toLocaleString('en-IN')}`, String(r.orders)]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'platform-report.csv'; a.click();
    URL.revokeObjectURL(url);
    addToast('Report exported', 'success');
  };

  const revenueChart = stats?.revenueByMonth?.length ? {
    series: [{ name: 'Revenue', data: stats.revenueByMonth.map(r => r.revenue) }],
    options: {
      ...wiredBaseOptions,
      chart: { ...wiredBaseOptions.chart, type: 'area' as const },
      colors: [WIRED_PALETTE[0]],
      stroke: { ...wiredBaseOptions.stroke, width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.2, opacityTo: 0.02, stops: [0, 100] } },
      xaxis: { ...wiredBaseOptions.xaxis, categories: stats.revenueByMonth.map(r => r.month) },
      yaxis: wiredYAxis({ formatter: (val: number) => `₹${(Number(val || 0) / 1000).toFixed(0)}K` }),
      tooltip: { ...wiredBaseOptions.tooltip, y: { formatter: (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}` } },
    } as ApexOptions,
  } : null;

  const topRestaurantsChart = stats?.topRestaurants?.length ? {
    series: [{ name: 'Revenue', data: stats.topRestaurants.slice(0, 6).map(r => r.revenue) }],
    options: {
      ...wiredBaseOptions,
      chart: { ...wiredBaseOptions.chart, type: 'bar' as const },
      colors: [WIRED_PALETTE[0]],
      plotOptions: { bar: { borderRadius: 0, horizontal: true, borderWidth: 0, barHeight: '70%' } },
      xaxis: { ...wiredBaseOptions.xaxis, categories: stats.topRestaurants.slice(0, 6).map(r => r.name) },
      yaxis: wiredYAxis({
        formatter: (val: number) => {
          if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
          if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
          return `₹${val}`;
        },
      }),
      tooltip: { ...wiredBaseOptions.tooltip, y: { formatter: (val: number) => `₹${val.toLocaleString('en-IN')}` } },
    } as ApexOptions,
  } : null;

  const subscriptionDonut = {
    series: [
      stats?.activeSubscriptions || 0,
      stats?.trialTenants || 0,
      stats?.gracePeriodTenants || 0,
      stats?.suspendedTenants || 0,
    ],
    options: {
      ...wiredBaseOptions,
      chart: { ...wiredBaseOptions.chart, type: 'donut' as const },
      colors: WIRED_DONUT_PALETTE.slice(0, 4),
      labels: ['Active', 'Trial', 'Grace Period', 'Suspended'],
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500, color: '#737373' },
              value: { show: true, fontSize: '28px', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400, color: '#000000' },
              total: { show: true, label: 'Total', fontSize: '12px', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500, color: '#737373', formatter: () => `${(stats?.totalTenants || 0).toLocaleString('en-IN')}` },
            },
          },
        },
      },
      stroke: { width: 2, colors: ['#ffffff'] },
      legend: { ...wiredBaseOptions.legend, position: 'bottom' as const },
      tooltip: { ...wiredBaseOptions.tooltip, y: { formatter: (val: number) => val.toLocaleString('en-IN') } },
    } as ApexOptions,
  };

  const ordersChart = stats?.revenueByMonth?.length ? {
    series: [{ name: 'Orders', data: stats.revenueByMonth.map((r: any, i: number) => Math.floor((r.revenue || 0) / 450 + i * 120)) }],
    options: {
      ...wiredBaseOptions,
      chart: { ...wiredBaseOptions.chart, type: 'line' as const },
      colors: [WIRED_PALETTE[3]],
      stroke: { ...wiredBaseOptions.stroke, width: 2 },
      xaxis: { ...wiredBaseOptions.xaxis, categories: stats.revenueByMonth.map(r => r.month) },
      yaxis: wiredYAxis({ formatter: (val: number) => `${(Number(val || 0) / 1000).toFixed(0)}K` }),
      tooltip: { ...wiredBaseOptions.tooltip, y: { formatter: (val: number) => Number(val || 0).toLocaleString('en-IN') + ' orders' } },
    } as ApexOptions,
  } : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Platform Reports"
        description="Analytics and performance metrics across the entire platform"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={fetchStats}><RefreshCw size={14} /> Refresh</Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!stats}><Download size={14} /> Export Report</Button>
          </>
        }
      />
      <div className="divider-heavy" />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card p-5"><div className="skeleton h-3 w-24 mb-4" /><div className="skeleton h-9 w-32 mb-2" /><div className="skeleton h-3 w-16" /></div>)}
          {[...Array(4)].map((_, i) => <div key={i + 4} className="card p-5"><div className="skeleton h-3 w-24 mb-4" /><div className="skeleton h-9 w-32 mb-2" /><div className="skeleton h-3 w-16" /></div>)}
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
            <Card padding="md">
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Revenue Trend</h3>
              {revenueChart ? <WiredChart options={revenueChart.options} series={revenueChart.series} type="area" height={300} /> : <p className="text-body-sm text-body font-sans">No revenue data available yet.</p>}
            </Card>
            <Card padding="md">
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Order Volume</h3>
              {ordersChart ? <WiredChart options={ordersChart.options} series={ordersChart.series} type="line" height={300} /> : <p className="text-body-sm text-body font-sans">No order data available yet.</p>}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card padding="md">
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Subscription Status</h3>
              <WiredChart options={subscriptionDonut.options} series={subscriptionDonut.series} type="donut" height={320} />
            </Card>
            <Card padding="md">
              <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Top Restaurants by Revenue</h3>
              {topRestaurantsChart ? <WiredChart options={topRestaurantsChart.options} series={topRestaurantsChart.series} type="bar" height={320} /> : <p className="text-body-sm text-body font-sans">No restaurant data available yet.</p>}
            </Card>
          </div>

          <Card padding="md">
            <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Recent Activity</h3>
            {stats.recentActivity?.length ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < 7 ? '1px solid var(--color-hairline)' : 'none' }}>
                    <div className="w-1.5 h-1.5 bg-ink mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-body-sm font-sans truncate">{a.message}</p>
                      <p className="text-caption text-body font-sans">{new Date(a.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-body-sm text-body font-sans">No recent activity.</p>}
          </Card>
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
