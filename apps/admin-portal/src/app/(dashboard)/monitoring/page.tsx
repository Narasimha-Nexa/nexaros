'use client';
import React from 'react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Activity, Server, Database, Cpu, HardDrive, Wifi, RefreshCw } from 'lucide-react';

const services = [
  { name: 'API Server (NestJS)', status: 'operational', uptime: '99.98%', cpu: '23%', memory: '1.2GB / 4GB', requests: '1,247/min' },
  { name: 'PostgreSQL Database', status: 'operational', uptime: '99.99%', cpu: '12%', memory: '2.1GB / 8GB', connections: '45 / 100' },
  { name: 'Redis Cache', status: 'operational', uptime: '100%', cpu: '5%', memory: '256MB / 1GB', keys: '12,847' },
  { name: 'Background Jobs (Bull)', status: 'degraded', uptime: '99.2%', cpu: '67%', memory: '512MB / 2GB', queue: '23 pending' },
  { name: 'Socket.IO Server', status: 'operational', uptime: '99.97%', cpu: '8%', memory: '128MB / 512MB', connections: '342' },
  { name: 'Marketing Website', status: 'operational', uptime: '100%', cpu: '3%', memory: '64MB / 256MB', requests: '89/min' },
];

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
                <div className="text-right">
                  <p>Uptime</p>
                  <p className="text-ink font-semibold">{service.uptime}</p>
                </div>
                <div className="text-right">
                  <p>CPU</p>
                  <p className="text-ink font-semibold">{service.cpu}</p>
                </div>
                <div className="text-right">
                  <p>Memory</p>
                  <p className="text-ink font-semibold">{service.memory}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
