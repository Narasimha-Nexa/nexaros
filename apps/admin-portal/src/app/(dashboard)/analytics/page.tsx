'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, RefreshCw, TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Users, AlertTriangle, Lightbulb, Target, Sparkles, Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { WiredChart, WIRED_PALETTE, WIRED_DONUT_PALETTE, wiredBaseOptions, wiredYAxis } from '@/components/charts/wired-chart';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useTenantSelector, TenantSelector } from '@/components/layout/tenant-selector';

type Range = 'today' | '7d' | '30d' | '90d';

const RANGE_MAP: Record<Range, { from: string; to: string }> = {
  today: (() => { const t = new Date(); t.setHours(0, 0, 0, 0); const f = new Date(t); f.setDate(f.getDate() - 1); return { from: f.toISOString(), to: new Date().toISOString() }; })(),
  '7d': (() => { const t = new Date(); const f = new Date(t); f.setDate(f.getDate() - 7); return { from: f.toISOString(), to: t.toISOString() }; })(),
  '30d': (() => { const t = new Date(); const f = new Date(t); f.setDate(f.getDate() - 30); return { from: f.toISOString(), to: t.toISOString() }; })(),
  '90d': (() => { const t = new Date(); const f = new Date(t); f.setDate(f.getDate() - 90); return { from: f.toISOString(), to: t.toISOString() }; })(),
};

export default function AnalyticsPage() {
  const { tenantId, setTenantId, tenants } = useTenantSelector();
  const [range, setRange] = useState<Range>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [orders, setOrders] = useState<any>(null);
  const [customers, setCustomers] = useState<any>(null);
  const [profit, setProfit] = useState<any>(null);
  const [peak, setPeak] = useState<any>(null);
  const [topItems, setTopItems] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const { addToast } = useToastStore();

  const params = () => {
    const r = RANGE_MAP[range];
    return { from: r.from, to: r.to };
  };

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    const p = params();
    try {
      const [s, rev, ord, cus, pr, pk, ti, ins, gl, al, fc] = await Promise.allSettled([
        adminApi.getBiExecutiveSummary(tenantId, p),
        adminApi.getBiRevenueTrend(tenantId, p),
        adminApi.getBiOrdersTrend(tenantId, p),
        adminApi.getBiCustomerTrend(tenantId, p),
        adminApi.getBiProfitability(tenantId, p),
        adminApi.getBiPeakHours(tenantId, p),
        adminApi.getBiTopItems(tenantId, p),
        adminApi.getBiInsights(tenantId, p),
        adminApi.getBiGoals(tenantId),
        adminApi.getBiAlerts(tenantId),
        adminApi.getForecastRevenue(tenantId, { horizon: '14' }),
      ]);
      const ok = (r: any) => (r.status === 'fulfilled' ? (r.value?.data ?? r.value ?? null) : null);
      setSummary(ok(s));
      setRevenue(ok(rev));
      setOrders(ok(ord));
      setCustomers(ok(cus));
      setProfit(ok(pr));
      setPeak(ok(pk));
      setTopItems(ok(ti));
      setInsights(ok(ins));
      setGoals(ok(gl));
      setAlerts(ok(al));
      setForecast(ok(fc));
    } catch (err: any) {
      setError(err?.message || 'Failed to load analytics');
      addToast(err?.message || 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [tenantId, range, addToast]);

  useEffect(() => { load(); }, [load]);

  const s = summary?.current || summary || {};
  const revData = (revenue?.series || []).map((d: any) => ({ x: d.label || d.date, y: d.revenue ?? d.value ?? 0 }));
  const ordData = (orders?.series || []).map((d: any) => ({ x: d.label || d.date, y: d.orders ?? d.value ?? 0 }));
  const cusData = (customers?.series || []).map((d: any) => ({ x: d.label || d.date, y: d.customers ?? d.value ?? 0 }));

  const revenueOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'area' },
    xaxis: { categories: revData.map((d: any) => d.x) },
    yaxis: wiredYAxis({ formatter: (v: number) => formatCurrency(v) }),
    colors: [WIRED_PALETTE[4]],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
  };
  const ordersOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'bar' },
    xaxis: { categories: ordData.map((d: any) => d.x) },
    yaxis: wiredYAxis({ formatter: (v: number) => `${v}` }),
    colors: [WIRED_PALETTE[2]],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
    dataLabels: { enabled: false },
  };
  const customerOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'line' },
    xaxis: { categories: cusData.map((d: any) => d.x) },
    yaxis: wiredYAxis({ formatter: (v: number) => `${v}` }),
    colors: [WIRED_PALETTE[3]],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
  };
  const peakData = (peak?.byHour || []).map((v: any) => v.orders ?? v.count ?? 0);
  const peakOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'bar' },
    xaxis: { categories: (peak?.byHour || []).map((_: any, i: number) => `${i}:00`) },
    yaxis: wiredYAxis({ formatter: (v: number) => `${v}` }),
    colors: [WIRED_PALETTE[1]],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '70%' } },
    dataLabels: { enabled: false },
  };
  const topItemsData = (topItems?.items || []).map((i: any) => i.quantity ?? i.revenue ?? 0);
  const topItemsOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'bar' },
    xaxis: { categories: (topItems?.items || []).map((i: any) => i.name) },
    yaxis: wiredYAxis({ formatter: (v: number) => `${v}` }),
    colors: [WIRED_PALETTE[4]],
    plotOptions: { bar: { borderRadius: 3, barHeight: '60%', horizontal: true } },
    dataLabels: { enabled: false },
  };
  const forecastData = (forecast?.historical || []).concat(forecast?.forecast || []).map((d: any) => d.revenue ?? d.value ?? 0);
  const forecastOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'area' },
    xaxis: { categories: (forecast?.historical || []).concat(forecast?.forecast || []).map((d: any) => d.label || d.date) },
    yaxis: wiredYAxis({ formatter: (v: number) => formatCurrency(v) }),
    colors: [WIRED_PALETTE[4], WIRED_PALETTE[1]],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Executive Analytics"
        description="Real-time business performance, forecasts and AI insights."
        actions={
          <div className="flex items-center gap-2">
            <TenantSelector tenantId={tenantId} onTenantChange={setTenantId} tenants={tenants} />
            <Select
              label="Range"
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              options={[
                { value: 'today', label: 'Today' },
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
              ]}
            />
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        }
      />

      {error && !loading && (
        <Card padding="lg" className="text-center border-error/30">
          <AlertTriangle size={32} className="mx-auto text-error mb-3" />
          <p className="text-body font-sans">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Revenue" value={formatCurrency(s.revenue ?? 0)} change={s.revenueChange ? `${s.revenueChange}%` : undefined} changeType={s.revenueChange >= 0 ? 'positive' : 'negative'} />
            <StatCard label="Orders" value={formatNumber(s.orders ?? 0)} change={s.ordersChange ? `${s.ordersChange}%` : undefined} changeType={s.ordersChange >= 0 ? 'positive' : 'negative'} />
            <StatCard label="Avg Order Value" value={formatCurrency(s.averageOrderValue ?? 0)} />
            <StatCard label="Customers" value={formatNumber(s.customers ?? 0)} change={s.customerChange ? `${s.customerChange}%` : undefined} changeType={s.customerChange >= 0 ? 'positive' : 'negative'} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card padding="md" className="lg:col-span-2">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><DollarSign size={18} className="text-success" /> Revenue Trend</h3>
              {revData.length ? <WiredChart options={revenueOptions} series={[{ name: 'Revenue', data: revData.map((d: any) => d.y) }]} type="area" height={300} /> : <Empty />}
            </Card>
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><Target size={18} className="text-link" /> KPI Goals</h3>
              {!goals?.length ? <Empty text="No goals set" /> : (
                <div className="space-y-3">
                  {goals.slice(0, 5).map((g: any) => {
                    const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
                    return (
                      <div key={g.id}>
                        <div className="flex justify-between text-sm font-sans mb-1">
                          <span className="text-ink font-medium capitalize">{g.metric}</span>
                          <span className="text-body">{formatNumber(g.current)} / {formatNumber(g.target)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><ShoppingBag size={18} className="text-accent" /> Orders Trend</h3>
              {ordData.length ? <WiredChart options={ordersOptions} series={[{ name: 'Orders', data: ordData.map((d: any) => d.y) }]} type="bar" height={280} /> : <Empty />}
            </Card>
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><Users size={18} className="text-link" /> Customer Trend</h3>
              {cusData.length ? <WiredChart options={customerOptions} series={[{ name: 'Customers', data: cusData.map((d: any) => d.y) }]} type="line" height={280} /> : <Empty />}
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-warning" /> Peak Hours</h3>
              {peakData.length ? <WiredChart options={peakOptions} series={[{ name: 'Orders', data: peakData }]} type="bar" height={240} /> : <Empty />}
            </Card>
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-success" /> Top Items</h3>
              {topItemsData.length ? <WiredChart options={topItemsOptions} series={[{ name: 'Sold', data: topItemsData }]} type="bar" height={240} /> : <Empty />}
            </Card>
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><Calendar size={18} className="text-link" /> 14-Day Forecast</h3>
              {forecastData.length ? <WiredChart options={forecastOptions} series={[{ name: 'Revenue', data: forecastData }]} type="area" height={240} /> : <Empty />}
            </Card>
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-start">
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><Lightbulb size={18} className="text-accent" /> AI Insights</h3>
              {!insights?.insights?.length ? <Empty text="No insights yet" /> : (
                <div className="space-y-3">
                  {insights.insights.slice(0, 6).map((a: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-ink/5">
                      {a.severity === 'critical' || a.type === 'critical' ? <AlertTriangle size={18} className="text-error shrink-0 mt-0.5" />
                        : a.severity === 'warning' || a.type === 'warning' ? <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                        : <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />}
                      <div>
                        <p className="font-sans font-semibold text-sm text-ink">{a.title}</p>
                        <p className="text-caption text-body font-sans mt-0.5">{a.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-warning" /> Active Alerts</h3>
              {!alerts?.length ? <Empty text="No active alerts" /> : (
                <div className="space-y-2">
                  {alerts.slice(0, 6).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-ink/5">
                      <div>
                        <p className="font-sans font-medium text-sm text-ink">{a.title}</p>
                        <p className="text-caption text-body">{a.metric} • {a.condition}</p>
                      </div>
                      <span className={`text-xs font-semibold ${a.severity === 'critical' ? 'text-error' : a.severity === 'warning' ? 'text-warning' : 'text-body'}`}>{a.severity}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Empty({ text = 'No data for this period' }: { text?: string }) {
  return <p className="text-body font-sans text-sm py-8 text-center">{text}</p>;
}
