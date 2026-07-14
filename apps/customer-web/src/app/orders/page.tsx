'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Clock, ArrowRight } from 'lucide-react';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth-store';
import type { Order } from '@/types';

const STATUS_COLORS: Record<string, string> = { DELIVERED: 'success', COMPLETED: 'success', PREPARING: 'warning', PENDING: 'default', CONFIRMED: 'primary', CANCELLED: 'danger', OUT_FOR_DELIVERY: 'primary' };

export default function OrdersPage() {
  const { orderHistory, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'past'>('all');

  if (!isAuthenticated) {
    return <div className="max-w-4xl mx-auto px-4 py-16"><EmptyState icon="🔒" title="Please sign in" description="Sign in to view your orders" action={<Link href="/login"><Button>Sign In</Button></Link>} /></div>;
  }

  const filtered = activeTab === 'all' ? orderHistory : activeTab === 'active' ? orderHistory.filter((o) => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)) : orderHistory.filter((o) => ['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-6">My Orders</h1>

      <div className="flex gap-2 mb-6">
        {[{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'past', label: 'Past' }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn('px-4 py-2 rounded-full text-sm font-medium border transition-all', activeTab === tab.id ? 'bg-ink text-white border-ink' : 'border-hairline text-body hover:text-ink')}>
            {tab.label} {tab.id === 'all' ? `(${orderHistory.length})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📦" title={activeTab === 'active' ? 'No active orders' : activeTab === 'past' ? 'No past orders' : 'No orders yet'} description={activeTab === 'all' ? 'Place your first order to see it here' : ''} action={activeTab === 'all' ? <Link href="/menu"><Button>Browse Menu</Button></Link> : undefined} />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-ink">Order #{order.orderNumber}</span>
                  <Badge variant={(STATUS_COLORS[order.status] || 'default') as any}>{order.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-body">
                  <span className="flex items-center gap-1"><Clock size={14} />{formatDate(order.createdAt)}</span>
                  <span>{order.items.length} items</span>
                  <span className="font-semibold text-ink">{formatPrice(order.totalAmount)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {order.items.slice(0, 3).map((item) => (
                    <span key={item.id} className="px-2 py-1 rounded-md bg-hairline text-xs text-body">{item.quantity}x {item.name}</span>
                  ))}
                  {order.items.length > 3 && <span className="text-xs text-body self-center">+{order.items.length - 3} more</span>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
