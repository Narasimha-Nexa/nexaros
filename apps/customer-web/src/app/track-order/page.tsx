'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, CheckCircle2, Circle, Clock, Truck, ChefHat, UtensilsCrossed } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { cn, formatPrice, formatTime } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Order } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PENDING: { label: 'Order Placed', icon: Package, color: 'bg-yellow-500' },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-500' },
  PREPARING: { label: 'Preparing', icon: ChefHat, color: 'bg-orange-500' },
  COOKING: { label: 'Cooking', icon: UtensilsCrossed, color: 'bg-orange-500' },
  PACKED: { label: 'Packed', icon: Package, color: 'bg-purple-500' },
  READY: { label: 'Ready', icon: CheckCircle2, color: 'bg-green-500' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: Truck, color: 'bg-blue-500' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-500' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', icon: Circle, color: 'bg-red-500' },
};

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PREPARING', 'COOKING', 'PACKED', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id') || '';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    api.getOrder(orderId).then((data) => { setOrder(data); setLoading(false); });
  }, [orderId]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-16 text-center"><div className="w-12 h-12 border-4 border-ink border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-16 text-center"><p className="text-body">Order not found. Please check your order ID.</p></div>;

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const displayStatuses = order.type === 'DELIVERY' ? STATUS_ORDER : STATUS_ORDER.filter((s) => s !== 'OUT_FOR_DELIVERY');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Track Order</h1>
        <p className="text-body">Order #{order.orderNumber} · {STATUS_CONFIG[order.status]?.label || order.status}</p>
        {order.estimatedMinutes > 0 && order.status !== 'DELIVERED' && <p className="text-primary font-medium mt-1">Estimated {order.estimatedMinutes} min remaining</p>}
      </div>

      <Card className="p-6 mb-6">
        <div className="space-y-0">
          {displayStatuses.map((status, i) => {
            const config = STATUS_CONFIG[status];
            const isActive = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <div key={status} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isActive ? 'bg-ink text-white' : 'bg-hairline text-body', isCurrent && 'animate-pulse-dot')}>
                    {i < currentIndex ? <CheckCircle2 size={16} /> : <config.icon size={16} />}
                  </div>
                  {i < displayStatuses.length - 1 && <div className={cn('w-0.5 h-8', i < currentIndex ? 'bg-ink' : 'bg-hairline')} />}
                </div>
                <div className={cn('pb-6', isActive ? 'text-ink' : 'text-body')}>
                  <p className="font-medium text-sm">{config.label}</p>
                  {isCurrent && order.statusHistory[order.statusHistory.length - 1] && (
                    <p className="text-xs text-body mt-0.5">{formatTime(order.statusHistory[order.statusHistory.length - 1].createdAt)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold text-ink mb-3">Order Items</h3>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-ink"><span className="font-medium">{item.quantity}x</span> {item.name}</span>
              <span className="text-body">{formatPrice(item.totalPrice)}</span>
            </div>
          ))}
        </div>
        <hr className="my-3 border-hairline" />
        <div className="flex justify-between font-bold"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></div>
      </Card>
    </div>
  );
}

export default function TrackOrderPage() {
  return <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-16 text-center"><div className="w-12 h-12 border-4 border-ink border-t-transparent rounded-full animate-spin mx-auto" /></div>}><TrackOrderContent /></Suspense>;
}
