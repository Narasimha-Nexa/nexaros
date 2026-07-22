'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, Lightbulb, TrendingUp, Package, AlertTriangle, RefreshCw, Info, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { WiredChart, WIRED_PALETTE, wiredBaseOptions, wiredYAxis } from '@/components/charts/wired-chart';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';

type InsightType = 'info' | 'warning' | 'success' | 'critical';

export default function AiDashboardPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const [insights, setInsights] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [pairings, setPairings] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToastStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [iRes, fRes] = await Promise.allSettled([
        adminApi.getAiInsights(tenantId),
        adminApi.getAiForecast(tenantId, 7),
      ]);
      if (iRes.status === 'rejected') throw iRes.reason;
      if (fRes.status === 'rejected') throw fRes.reason;
      setInsights(iRes.value?.data ?? null);
      setForecast(fRes.value?.data ?? null);
      const firstItem = fRes.value?.data?.[0];
      if (firstItem?.menuItemId) setSelectedItem(firstItem.menuItemId);
    } catch (err: any) {
      setError(err?.message || 'Failed to load AI data');
      addToast(err?.message || 'Failed to load AI data', 'error');
    } finally {
      setLoading(false);
    }
  }, [tenantId, addToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedItem) return;
    let active = true;
    adminApi.getAiPairings(tenantId, selectedItem)
      .then((r) => { if (active) setPairings(r?.data ?? []); })
      .catch(() => { if (active) setPairings([]); });
    return () => { active = false; };
  }, [tenantId, selectedItem]);

  const forecastOptions: ApexCharts.ApexOptions = {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'bar' },
    xaxis: {
      categories: (forecast || []).map((f: any) => f.name),
      labels: { rotate: -45, style: { fontSize: '11px' } },
    },
    yaxis: wiredYAxis({ formatter: (v: number) => `${v}` }),
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%', distributed: true } },
    legend: { show: false },
    colors: WIRED_PALETTE,
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v} units/day` } },
  };

  const forecastSeries = [{ name: 'Daily Avg', data: (forecast || []).map((f: any) => f.dailyAverage) }];

  const trendColor = (t: string) =>
    t === 'HIGH' ? 'text-success' : t === 'MEDIUM' ? 'text-warning' : 'text-body';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="AI Dashboard"
        description="AI-generated insights, demand forecasts and pairing recommendations for this restaurant."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
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
            <StatCard label="Orders Today" value={insights?.todayOrders ?? 0} />
            <StatCard label="Orders (7d)" value={insights?.weeklyOrders ?? 0} />
            <StatCard label="Daily Avg (7d)" value={insights?.weeklyAverage ?? 0} />
            <StatCard label="Items Forecasted" value={forecast?.length ?? 0} />
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 items-start">
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2">
                <Lightbulb size={18} className="text-accent" /> Insights & Alerts
              </h3>
              {!insights?.insights?.length ? (
                <p className="text-body font-sans text-sm">No alerts right now. Everything looks healthy.</p>
              ) : (
                <div className="space-y-3">
                  {insights.insights.map((a: any) => (
                    <div key={a.id} className="flex gap-3 p-3 rounded-lg bg-ink/5">
                      {a.type === 'critical' ? <XCircle size={18} className="text-error shrink-0 mt-0.5" />
                        : a.type === 'warning' ? <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                        : a.type === 'success' ? <TrendingUp size={18} className="text-success shrink-0 mt-0.5" />
                        : <Info size={18} className="text-link shrink-0 mt-0.5" />}
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
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-link" /> Demand Forecast (next 7 days)
              </h3>
              {!forecast?.length ? (
                <p className="text-body font-sans text-sm">Not enough order history to forecast yet.</p>
              ) : (
                <WiredChart options={forecastOptions} series={forecastSeries} type="bar" height={320} />
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2">
                <Package size={18} className="text-accent" /> Top Forecasted Items
              </h3>
              {!forecast?.length ? (
                <p className="text-body font-sans text-sm">No data.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead>
                      <tr className="text-left text-body/60 border-b border-ink/10">
                        <th className="py-2 font-medium">Item</th>
                        <th className="py-2 font-medium">Daily Avg</th>
                        <th className="py-2 font-medium">Next Week</th>
                        <th className="py-2 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecast.map((f: any) => (
                        <tr
                          key={f.menuItemId}
                          onClick={() => setSelectedItem(f.menuItemId)}
                          className={`border-b border-ink/5 cursor-pointer transition-colors ${selectedItem === f.menuItemId ? 'bg-accent/10' : 'hover:bg-ink/5'}`}
                        >
                          <td className="py-2 font-medium text-ink">{f.name}</td>
                          <td className="py-2 text-body">{f.dailyAverage}</td>
                          <td className="py-2 text-body">{f.forecastNextWeek}</td>
                          <td className={`py-2 font-semibold ${trendColor(f.trend)}`}>{f.trend}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card padding="md">
              <h3 className="font-sans font-semibold text-ink mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-accent" /> Pairing Suggestions
              </h3>
              {!selectedItem ? (
                <p className="text-body font-sans text-sm">Select an item to see pairings.</p>
              ) : !pairings?.length ? (
                <p className="text-body font-sans text-sm">No frequent pairings found for this item.</p>
              ) : (
                <div className="space-y-2">
                  {pairings.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-ink/5">
                      <div>
                        <p className="font-sans font-medium text-sm text-ink">{p.name}</p>
                        <p className="text-caption text-body">Ordered together {p.pairCount}×</p>
                      </div>
                      {typeof p.price === 'number' && (
                        <span className="text-sm font-semibold text-accent">₹{p.price}</span>
                      )}
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
