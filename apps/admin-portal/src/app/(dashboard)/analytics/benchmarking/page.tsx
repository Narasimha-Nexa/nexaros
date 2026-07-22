'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { GitCompareArrows, RefreshCw, Trophy, MapPin, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { WiredChart, WIRED_PALETTE, wiredBaseOptions, wiredYAxis } from '@/components/charts/wired-chart';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useTenantSelector, TenantSelector } from '@/components/layout/tenant-selector';

export default function BenchmarkingPage() {
  const { tenantId, setTenantId, tenants } = useTenantSelector();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [regional, setRegional] = useState<any>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const { addToast } = useToastStore();

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    const p: Record<string, string> = {};
    if (selectedBranches.length) p.branchIds = selectedBranches.join(',');
    try {
      const [lb, cmp, reg] = await Promise.allSettled([
        adminApi.getBiBranchLeaderboard(tenantId, p),
        adminApi.getBiBranchComparison(tenantId, p),
        adminApi.getBiRegionalPerformance(tenantId, p),
      ]);
      const ok = (r: any) => (r.status === 'fulfilled' ? (r.value?.data ?? r.value ?? null) : null);
      setLeaderboard(ok(lb));
      setComparison(ok(cmp));
      setRegional(ok(reg));
    } catch (err: any) {
      setError(err?.message || 'Failed to load benchmarking data');
      addToast(err?.message || 'Failed to load benchmarking data', 'error');
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedBranches, addToast]);

  useEffect(() => { load(); }, [load]);

  const branches = leaderboard?.branches || comparison?.branches || [];
  const revByBranch = comparison?.byMetric?.revenue || comparison?.revenue || [];
  const ordByBranch = comparison?.byMetric?.orders || comparison?.orders || [];
  const marginByBranch = comparison?.byMetric?.margin || comparison?.margin || [];

  const revOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'bar' },
    xaxis: { categories: revByBranch.map((b: any) => b.name || b.branchName) },
    yaxis: wiredYAxis({ formatter: (v: number) => formatCurrency(v) }),
    colors: WIRED_PALETTE,
    plotOptions: { bar: { borderRadius: 3, columnWidth: '55%', distributed: true } },
    legend: { show: false },
    dataLabels: { enabled: false },
  };
  const ordOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'bar' },
    xaxis: { categories: ordByBranch.map((b: any) => b.name || b.branchName) },
    yaxis: wiredYAxis({ formatter: (v: number) => `${v}` }),
    colors: [WIRED_PALETTE[2]],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
    dataLabels: { enabled: false },
  };
  const marginOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'bar' },
    xaxis: { categories: marginByBranch.map((b: any) => b.name || b.branchName) },
    yaxis: wiredYAxis({ formatter: (v: number) => `${v}%` }),
    colors: [WIRED_PALETTE[4]],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '55%' } },
    dataLabels: { enabled: false },
  };
  const regionalOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'donut' },
    labels: (regional?.regions || []).map((r: any) => r.region || r.name),
    yaxis: wiredYAxis({ formatter: (v: number) => formatCurrency(v) }),
    colors: WIRED_PALETTE,
    legend: { position: 'bottom' },
    dataLabels: { enabled: true },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Branch Benchmarking"
        description="Compare performance across branches and regions."
        actions={
          <div className="flex items-center gap-2">
            <TenantSelector tenantId={tenantId} onTenantChange={setTenantId} tenants={tenants} />
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </Button>
          </div>
        }
      />

      {error && !loading && (
        <Card padding="lg" className="text-center border-error/30">
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
            <StatCard label="Branches" value={branches.length || leaderboard?.count || 0} />
            <StatCard label="Top Branch" value={branches[0]?.name || '—'} />
            <StatCard label="Best Revenue" value={formatCurrency(branches[0]?.revenue ?? branches[0]?.totalRevenue ?? 0)} />
            <StatCard label="Regions" value={regional?.regions?.length || 0} />
          </div>

          <Card padding="md">
            <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><Trophy size={18} className="text-warning" /> Branch Leaderboard</h3>
            {!branches.length ? <p className="text-body text-sm py-6 text-center">No branches found.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="text-left text-body/60 border-b border-ink/10">
                      <th className="py-2 font-medium">#</th>
                      <th className="py-2 font-medium">Branch</th>
                      <th className="py-2 font-medium">Revenue</th>
                      <th className="py-2 font-medium">Orders</th>
                      <th className="py-2 font-medium">Avg Order</th>
                      <th className="py-2 font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((b: any, i: number) => (
                      <tr key={b.id} className="border-b border-ink/5">
                        <td className="py-2 font-medium text-ink">{i + 1}</td>
                        <td className="py-2 font-medium text-ink">{b.name}</td>
                        <td className="py-2 text-body">{formatCurrency(b.revenue ?? b.totalRevenue ?? 0)}</td>
                        <td className="py-2 text-body">{formatNumber(b.orders ?? b.totalOrders ?? 0)}</td>
                        <td className="py-2 text-body">{formatCurrency(b.averageOrderValue ?? b.aov ?? 0)}</td>
                        <td className="py-2 text-body">{b.margin != null ? `${b.margin}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-success" /> Revenue by Branch</h3>
              {revByBranch.length ? <WiredChart options={revOptions} series={[{ name: 'Revenue', data: revByBranch.map((b: any) => b.revenue ?? b.value ?? 0) }]} type="bar" height={280} /> : <p className="text-body text-sm py-6 text-center">No data</p>}
            </Card>
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-link" /> Orders by Branch</h3>
              {ordByBranch.length ? <WiredChart options={ordOptions} series={[{ name: 'Orders', data: ordByBranch.map((b: any) => b.orders ?? b.value ?? 0) }]} type="bar" height={280} /> : <p className="text-body text-sm py-6 text-center">No data</p>}
            </Card>
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-accent" /> Margin by Branch</h3>
              {marginByBranch.length ? <WiredChart options={marginOptions} series={[{ name: 'Margin', data: marginByBranch.map((b: any) => b.margin ?? b.value ?? 0) }]} type="bar" height={280} /> : <p className="text-body text-sm py-6 text-center">No data</p>}
            </Card>
          </div>

          <Card padding="md">
            <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2"><MapPin size={18} className="text-warning" /> Regional Performance</h3>
            {regional?.regions?.length ? <WiredChart options={regionalOptions} series={[(regional.regions || []).map((r: any) => r.revenue ?? r.value ?? 0)]} type="donut" height={320} /> : <p className="text-body text-sm py-6 text-center">No regional data</p>}
          </Card>
        </>
      )}
    </div>
  );
}
