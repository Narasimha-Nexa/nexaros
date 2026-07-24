'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui';
import { cn, formatTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { useOrderSocket } from '@/lib/socket';

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  latitude: number | null;
  longitude: number | null;
  rating: number;
}

interface DeliveryLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

interface StatusTimelineItem {
  status: string;
  label: string;
  timestamp: string | null;
}

interface DeliveryInfo {
  id: string;
  status: string;
  customerAddress: string | null;
  customerName: string | null;
  estimatedArrival: string | null;
  partner: DeliveryPartner | null;
  order: {
    orderNumber: number;
    customerName: string | null;
    totalAmount: number;
    type: string;
    status: string;
    createdAt: string;
  } | null;
  locations: DeliveryLocation[];
  statusTimeline: StatusTimelineItem[];
  createdAt: string;
}

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; description: string; color: string }> = {
  PENDING: { label: 'Order Placed', description: 'Waiting for restaurant to prepare', color: 'bg-yellow-500' },
  ASSIGNED: { label: 'Partner Assigned', description: 'A delivery partner has been assigned', color: 'bg-blue-500' },
  DISPATCHED: { label: 'Dispatched', description: 'Partner is heading to the restaurant', color: 'bg-indigo-500' },
  PICKED_UP: { label: 'Picked Up', description: 'Food has been picked up', color: 'bg-purple-500' },
  IN_TRANSIT: { label: 'On the Way', description: 'Your food is on its way!', color: 'bg-orange-500' },
  ARRIVING: { label: 'Arriving', description: 'Your delivery is almost here', color: 'bg-green-600' },
  DELIVERED: { label: 'Delivered', description: 'Enjoy your meal!', color: 'bg-green-500' },
  FAILED: { label: 'Failed', description: 'Delivery could not be completed', color: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', description: 'Delivery has been cancelled', color: 'bg-gray-500' },
};

const DELIVERY_STATUS_ORDER = ['PENDING', 'ASSIGNED', 'DISPATCHED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVING', 'DELIVERED'];

function TrackDeliveryContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('id') || '';
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDelivery = useCallback(async () => {
    if (!orderId) { setLoading(false); return; }
    try {
      const data = await api.getDeliveryByOrder(orderId);
      setDelivery(data);
      setError(null);
    } catch {
      setError('Delivery not found. Please check your order ID.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDelivery();
  }, [fetchDelivery]);

  // Polling fallback — refresh every 15 seconds for delivery tracking
  useEffect(() => {
    if (!orderId || !delivery) return;
    const timer = setInterval(fetchDelivery, 15_000);
    return () => clearInterval(timer);
  }, [orderId, delivery, fetchDelivery]);

  // Real-time location updates via WebSocket
  useOrderSocket({
    orderId,
    enabled: !!orderId && !!delivery,
    onStatusChange: (data: any) => {
      setDelivery((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: data.status || prev.status,
        };
      });
    },
    onOrderReady: () => {},
    onItemStatusChange: () => {},
    onOrderCancelled: (data: any) => {
      setDelivery((prev) => {
        if (!prev) return prev;
        return { ...prev, status: 'CANCELLED' };
      });
    },
    onItemsChanged: () => {},
  });

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-ink border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-body">{error || 'Delivery not found.'}</p>
      </div>
    );
  }

  const statusConfig = DELIVERY_STATUS_CONFIG[delivery.status] || DELIVERY_STATUS_CONFIG.PENDING;
  const currentIdx = DELIVERY_STATUS_ORDER.indexOf(delivery.status);
  const isVisibleStatus = currentIdx >= 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Track Delivery</h1>
        <p className="text-body">
          Order #{delivery.order?.orderNumber || '—'} · {statusConfig.label}
        </p>
        {delivery.estimatedArrival && delivery.status !== 'DELIVERED' && (
          <p className="text-primary font-medium mt-1">Estimated arrival: {formatTime(delivery.estimatedArrival)}</p>
        )}
      </div>

      {/* Live Status Banner */}
      <Card className={cn('p-4 mb-6 border-l-4', {
        'border-l-yellow-500': delivery.status === 'PENDING',
        'border-l-blue-500': delivery.status === 'ASSIGNED',
        'border-l-indigo-500': delivery.status === 'DISPATCHED',
        'border-l-purple-500': delivery.status === 'PICKED_UP',
        'border-l-orange-500': delivery.status === 'IN_TRANSIT',
        'border-l-green-600': delivery.status === 'ARRIVING',
        'border-l-green-500': delivery.status === 'DELIVERED',
        'border-l-red-500': delivery.status === 'FAILED',
        'border-l-gray-500': delivery.status === 'CANCELLED',
      })}>
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white', statusConfig.color)}>
            {delivery.status === 'DELIVERED' ? '✓' : delivery.status === 'FAILED' ? '✕' : '●'}
          </div>
          <div>
            <p className="font-semibold text-ink">{statusConfig.label}</p>
            <p className="text-sm text-body">{statusConfig.description}</p>
          </div>
          {delivery.status !== 'DELIVERED' && delivery.status !== 'FAILED' && delivery.status !== 'CANCELLED' && (
            <div className="ml-auto">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-ping" />
            </div>
          )}
        </div>
      </Card>

      {/* Status Timeline */}
      {isVisibleStatus && (
        <Card className="p-6 mb-6">
          <div className="space-y-0">
            {DELIVERY_STATUS_ORDER.map((status, i) => {
              const cfg = DELIVERY_STATUS_CONFIG[status];
              const isActive = i <= currentIdx;
              const isCurrent = i === currentIdx;
              const timelineItem = delivery.statusTimeline.find((t) => t.status === status);
              return (
                <div key={status} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      isActive ? 'bg-ink text-white' : 'bg-hairline text-body',
                      isCurrent && 'ring-2 ring-ink ring-offset-2'
                    )}>
                      {i < currentIdx ? '✓' : i + 1}
                    </div>
                    {i < DELIVERY_STATUS_ORDER.length - 1 && (
                      <div className={cn('w-0.5 h-8', i < currentIdx ? 'bg-ink' : 'bg-hairline')} />
                    )}
                  </div>
                  <div className={cn('pb-6', isActive ? 'text-ink' : 'text-body')}>
                    <p className="font-medium text-sm">{cfg.label}</p>
                    <p className="text-xs text-body mt-0.5">{cfg.description}</p>
                    {timelineItem?.timestamp && (
                      <p className="text-xs text-body mt-0.5">{formatTime(timelineItem.timestamp)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Delivery Partner */}
      {delivery.partner && (
        <Card className="p-5 mb-6">
          <h3 className="font-semibold text-ink mb-3">Delivery Partner</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">{delivery.partner.name.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-ink">{delivery.partner.name}</p>
              <p className="text-sm text-body">{delivery.partner.vehicleType} · Rating: {delivery.partner.rating}★</p>
            </div>
            {delivery.partner.phone && (
              <a
                href={`tel:${delivery.partner.phone}`}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Call
              </a>
            )}
          </div>
        </Card>
      )}

      {/* Delivery Address */}
      {delivery.customerAddress && (
        <Card className="p-5 mb-6">
          <h3 className="font-semibold text-ink mb-2">Delivery Address</h3>
          <p className="text-body text-sm">{delivery.customerAddress}</p>
        </Card>
      )}

      {/* Order Summary */}
      {delivery.order && (
        <Card className="p-5">
          <h3 className="font-semibold text-ink mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-body">Order #</span>
              <span className="text-ink font-medium">{delivery.order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body">Customer</span>
              <span className="text-ink">{delivery.customerName || delivery.order.customerName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body">Total</span>
              <span className="text-ink font-medium">₹{delivery.order.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-body">Order Status</span>
              <span className="text-ink">{delivery.order.status}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function TrackDeliveryPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-ink border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <TrackDeliveryContent />
    </Suspense>
  );
}
