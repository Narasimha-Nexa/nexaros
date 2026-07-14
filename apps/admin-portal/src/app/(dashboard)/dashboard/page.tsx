'use client';
import React from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import {
  Building2, Users, CreditCard, TrendingUp, AlertTriangle,
  ArrowRight, LifeBuoy, Activity, DollarSign, Clock, Plus
} from 'lucide-react';

const stats = [
  { label: 'Total Restaurants', value: '2,847', change: '+12.5%', changeType: 'positive' as const },
  { label: 'Active Subscriptions', value: '2,156', change: '+8.3%', changeType: 'positive' as const },
  { label: 'Monthly Revenue', value: '₹42.8L', change: '+15.2%', changeType: 'positive' as const },
  { label: 'Pending Issues', value: '23', change: '-4.1%', changeType: 'negative' as const },
];

const recentActivity = [
  { id: '1', type: 'signup', message: 'New restaurant registered: Pizza Palace', time: '2 min ago' },
  { id: '2', type: 'payment', message: 'Payment received: ₹4,999 from Spice Garden', time: '15 min ago' },
  { id: '3', type: 'support', message: 'Support ticket #1234: Integration issue', time: '1 hour ago' },
  { id: '4', type: 'subscription', message: 'Plan upgraded: Food Court → Professional', time: '2 hours ago' },
  { id: '5', type: 'alert', message: 'High memory usage on Server 3', time: '3 hours ago' },
  { id: '6', type: 'signup', message: 'New restaurant registered: Curry House', time: '4 hours ago' },
];

const systemHealth = [
  { name: 'API Server', status: 'Operational', uptime: '99.98%' },
  { name: 'Database', status: 'Operational', uptime: '99.99%' },
  { name: 'Redis Cache', status: 'Operational', uptime: '100%' },
  { name: 'Background Jobs', status: 'Degraded', uptime: '99.2%' },
];

const topTenants = [
  { name: 'Spice Garden', plan: 'Enterprise', mrr: '₹14,999', status: 'active' },
  { name: 'Pizza Palace', plan: 'Professional', mrr: '₹4,999', status: 'active' },
  { name: 'Biryani Barn', plan: 'Professional', mrr: '₹4,999', status: 'active' },
  { name: 'Food Court Express', plan: 'Starter', mrr: '₹1,499', status: 'active' },
  { name: 'Curry House', plan: 'Trial', mrr: '₹0', status: 'trial' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command Center"
        title="Dashboard"
        actions={
          <>
            <Link href="/provision" className="btn btn-primary btn-sm">
              <Plus size={14} />
              Create Restaurant
            </Link>
            <Link href="/support" className="btn btn-outline btn-sm">
              <LifeBuoy size={14} />
              Support
            </Link>
          </>
        }
      />

      <div className="divider-heavy" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-display-xs font-sans">Recent Activity</h2>
              <Link href="/audit-logs" className="text-caption font-sans font-semibold text-link hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-hairline">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3">
                  <div className="mt-0.5 text-body shrink-0">
                    {item.type === 'signup' && <Building2 size={14} />}
                    {item.type === 'payment' && <DollarSign size={14} />}
                    {item.type === 'support' && <LifeBuoy size={14} />}
                    {item.type === 'subscription' && <CreditCard size={14} />}
                    {item.type === 'alert' && <AlertTriangle size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-sans truncate">{item.message}</p>
                    <p className="text-caption text-body font-sans flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* System Health */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-display-xs font-sans">System Health</h2>
              <Link href="/monitoring" className="text-caption font-sans font-semibold text-link hover:underline">
                Details
              </Link>
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

          {/* Top Tenants */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-display-xs font-sans">Top Restaurants</h2>
              <Link href="/tenants" className="text-caption font-sans font-semibold text-link hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {topTenants.map((tenant) => (
                <div key={tenant.name} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-body-sm font-sans font-medium truncate">{tenant.name}</p>
                    <p className="text-caption text-body font-sans">{tenant.plan}</p>
                  </div>
                  <Badge variant={tenant.status === 'trial' ? 'outline' : 'filled'}>
                    {tenant.mrr}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h2 className="text-display-xs font-sans mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/provision" className="btn btn-primary btn-sm w-full justify-start">
                <Plus size={14} />
                Create Restaurant
              </Link>
              <Link href="/tenants" className="btn btn-outline btn-sm w-full justify-start">
                <Building2 size={14} />
                Manage Restaurants
              </Link>
              <Link href="/subscriptions" className="btn btn-outline btn-sm w-full justify-start">
                <CreditCard size={14} />
                View Subscriptions
              </Link>
              <Link href="/settings" className="btn btn-outline btn-sm w-full justify-start">
                <Activity size={14} />
                Platform Settings
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
