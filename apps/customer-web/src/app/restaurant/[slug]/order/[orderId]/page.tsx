'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { trackOrder } from '@/lib/api';
import type { OrderTracking } from '@/lib/api';

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order Placed',
  CONFIRMED: 'Order Confirmed',
  PREPARING: 'Being Prepared',
  READY: 'Ready to Serve',
  SERVED: 'Served',
  COMPLETED: 'Completed',
};
const STATUS_ICONS: Record<string, string> = {
  PENDING: '📋',
  CONFIRMED: '✅',
  PREPARING: '👨‍🍳',
  READY: '🍽️',
  SERVED: '✨',
  COMPLETED: '✔️',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  PREPARING: 'bg-orange-500',
  READY: 'bg-green-500',
  SERVED: 'bg-teal-500',
  COMPLETED: 'bg-gray-400',
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const slug = params.slug as string;

  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    const load = () => {
      trackOrder(orderId)
        .then((data) => { setOrder(data); setLoading(false); })
        .catch(() => { setError('Order not found'); setLoading(false); });
    };
    load();
    // Poll every 10 seconds for status updates
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen p-8 text-center"><div className="text-6xl mb-4">🔍</div><h1 className="text-2xl font-bold mb-2">Order Not Found</h1></div>;
  if (!order) return null;

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCompleted = order.status === 'COMPLETED' || order.status === 'SERVED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${isCompleted ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white`}>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <div className="text-5xl mb-3">{STATUS_ICONS[order.status] || '📋'}</div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-blue-100 mt-1">
            {STATUS_LABELS[order.status] || order.status}
            {order.estimatedMinutes > 0 && !isCompleted && ` · ~${order.estimatedMinutes} min remaining`}
          </p>
          {isCompleted && <p className="text-green-100 mt-1">Your order has been {order.status.toLowerCase()}!</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress tracker */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Order Progress</h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              const isPast = i < currentStep;
              return (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isActive ? (isPast ? 'bg-green-500 text-white' : 'bg-blue-600 text-white shadow-md') : 'bg-gray-200 text-gray-400'
                    } ${isCurrent ? 'pulse-dot' : ''}`}>
                      {isPast ? '✓' : i + 1}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${isPast ? 'bg-green-500' : isCurrent ? 'bg-blue-300' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className={`pb-6 ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                    <p className="font-medium text-sm">{STATUS_LABELS[step]}</p>
                    {isCurrent && !isPast && !isCompleted && (
                      <p className="text-xs text-blue-600 mt-0.5 font-medium">In progress</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Items</h2>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-700"><span className="font-medium">{item.quantity}x</span> {item.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  item.status === 'READY' ? 'bg-green-100 text-green-700' :
                  item.status === 'PREPARING' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.status || 'Pending'}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-blue-600">₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>

        {/* Status history */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">Timeline</h2>
          <div className="space-y-3">
            {order.statusHistory.map((h, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-gray-400 w-16 flex-shrink-0">
                  {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-medium text-gray-700">{STATUS_LABELS[h.status] || h.status}</span>
                {h.notes && <span className="text-gray-400">- {h.notes}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Re-order button */}
        {isCompleted && (
          <a href={`/${slug}`} className="block w-full py-3 bg-blue-600 text-white rounded-xl text-center font-semibold hover:bg-blue-700">
            Order Again
          </a>
        )}
      </div>
    </div>
  );
}
