'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { WiredChart, wiredBaseOptions, wiredYAxis, WIRED_PALETTE } from '@/components/charts/wired-chart';
import { RefreshCw } from 'lucide-react';
import type { ApexOptions } from 'apexcharts';

const services = [
  { name: 'API Server (NestJS)', status: 'operational', uptime: '99.98%', cpu: '23%', memory: '1.2GB / 4GB', requests: '1,247/min' },
  { name: 'PostgreSQL Database', status: 'operational', uptime: '99.99%', cpu: '12%', memory: '2.1GB / 8GB', connections: '45 / 100' },
  { name: 'Redis Cache', status: 'operational', uptime: '100%', cpu: '5%', memory: '256MB / 1GB', keys: '12,847' },
  { name: 'Background Jobs (Bull)', status: 'degraded', uptime: '99.2%', cpu: '67%', memory: '512MB / 2GB', queue: '23 pending' },
  { name: 'Socket.IO Server', status: 'operational', uptime: '99.97%', cpu: '8%', memory: '128MB / 512MB', connections: '342' },
  { name: 'Marketing Website', status: 'operational', uptime: '100%', cpu: '3%', memory: '64MB / 256MB', requests: '89/min' },
];

const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

const responseTimeData = {
  series: [
    { name: 'Avg Response', data: [142, 138, 155, 131, 147, 142, 128, 135, 141, 144, 139, 142, 133, 128, 145, 138, 142, 131, 137, 142, 129, 144, 138, 142] },
    { name: 'P95', data: [312, 298, 345, 287, 319, 305, 278, 295, 312, 308, 296, 315, 289, 278, 321, 305, 312, 287, 302, 315, 281, 318, 305, 312] },
  ],
  options: {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'area' as const },
    colors: [WIRED_PALETTE[0], WIRED_PALETTE[1]],
    stroke: { ...wiredBaseOptions.stroke, width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.15, opacityTo: 0.01, stops: [0, 100] } },
    xaxis: {
      ...wiredBaseOptions.xaxis,
      categories: hours,
      labels: { ...wiredBaseOptions.xaxis?.labels, rotate: -45, hideOverlappingLabels: true, style: { ...wiredBaseOptions.xaxis?.labels?.style, fontSize: '10px' } },
    },
    yaxis: wiredYAxis({ formatter: (val: number) => `${val}ms` }),
    tooltip: { ...wiredBaseOptions.tooltip, shared: true, y: { formatter: (val: number) => `${val}ms` } },
    legend: { ...wiredBaseOptions.legend, position: 'top' as const, horizontalAlign: 'right' as const },
  } as ApexOptions,
};

const throughputData = {
  series: [{ name: 'Requests/min', data: [890, 1020, 1180, 1247, 1150, 980, 870, 1050, 1280, 1350, 1290, 1180, 1050, 920, 1100, 1250, 1320, 1180, 1050, 980, 1120, 1280, 1150, 1247] }],
  options: {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'line' as const },
    colors: [WIRED_PALETTE[3]],
    stroke: { ...wiredBaseOptions.stroke, width: 2 },
    xaxis: {
      ...wiredBaseOptions.xaxis,
      categories: hours,
      labels: { ...wiredBaseOptions.xaxis?.labels, rotate: -45, hideOverlappingLabels: true, style: { ...wiredBaseOptions.xaxis?.labels?.style, fontSize: '10px' } },
    },
    yaxis: wiredYAxis({ formatter: (val: number) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : `${val}` }),
    tooltip: { ...wiredBaseOptions.tooltip, y: { formatter: (val: number) => `${val.toLocaleString('en-IN')} req/min` } },
  } as ApexOptions,
};

const errorRateData = {
  series: [{ name: 'Errors', data: [2, 1, 0, 3, 1, 0, 2, 0, 1, 0, 2, 1, 0, 3, 1, 0, 2, 0, 1, 0, 2, 1, 0, 1] }],
  options: {
    ...wiredBaseOptions,
    chart: { ...wiredBaseOptions.chart, type: 'bar' as const },
    colors: [WIRED_PALETTE[5]],
    plotOptions: { bar: { borderRadius: 0, columnWidth: '70%', borderWidth: 0 } },
    xaxis: {
      ...wiredBaseOptions.xaxis,
      categories: hours,
      labels: { ...wiredBaseOptions.xaxis?.labels, rotate: -45, hideOverlappingLabels: true, style: { ...wiredBaseOptions.xaxis?.labels?.style, fontSize: '10px' } },
    },
    yaxis: wiredYAxis({ formatter: (val: number) => val.toFixed(0) }),
    tooltip: { ...wiredBaseOptions.tooltip, y: { formatter: (val: number) => `${val} errors` } },
  } as ApexOptions,
};

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="System" title="Monitoring" actions={<Button variant="outline" size="sm"><RefreshCw size={14} /> Refresh</Button>} />
      <div className="divider-heavy" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="System Uptime" value="99.97%" change="Last 30 days" changeType="positive" />
        <StatCard label="Avg Response Time" value="142ms" change="-8ms improvement" changeType="positive" />
        <StatCard label="Error Rate" value="0.03%" change="Within threshold" changeType="positive" />
        <StatCard label="Active Connections" value="342" change="Real-time users" changeType="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Response Time (24h)</h3>
          <WiredChart options={responseTimeData.options} series={responseTimeData.series} type="area" height={280} />
        </Card>
        <Card padding="md">
          <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Throughput (24h)</h3>
          <WiredChart options={throughputData.options} series={throughputData.series} type="line" height={280} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card padding="md" className="lg:col-span-2">
          <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Error Count (24h)</h3>
          <WiredChart options={errorRateData.options} series={errorRateData.series} type="bar" height={240} />
        </Card>
        <Card padding="md">
          <h3 className="text-body-sm font-sans font-semibold tracking-[0.1em] uppercase text-body mb-4">Uptime by Service</h3>
          <div className="space-y-4">
            {services.map((service) => {
              const uptimeNum = parseFloat(service.uptime);
              return (
                <div key={service.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-caption font-sans text-body">{service.name}</span>
                    <span className="text-caption font-sans font-semibold text-ink">{service.uptime}</span>
                  </div>
                  <div className="h-1.5 bg-hairline">
                    <div className={`h-full transition-all ${uptimeNum >= 99.9 ? 'bg-ink' : uptimeNum >= 99 ? 'bg-body' : 'bg-danger'}`} style={{ width: `${uptimeNum}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-display-xs font-sans mb-4">Services</h2>
        <div className="divider mb-4" />
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 border border-hairline">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${service.status === 'operational' ? 'bg-ink' : 'bg-body'}`} />
                <div>
                  <p className="text-body-sm font-sans font-semibold">{service.name}</p>
                  <p className="text-caption text-body font-sans capitalize">{service.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-caption text-body font-sans">
                <div className="text-right"><p>Uptime</p><p className="text-ink font-semibold">{service.uptime}</p></div>
                <div className="text-right"><p>CPU</p><p className="text-ink font-semibold">{service.cpu}</p></div>
                <div className="text-right"><p>Memory</p><p className="text-ink font-semibold">{service.memory}</p></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
