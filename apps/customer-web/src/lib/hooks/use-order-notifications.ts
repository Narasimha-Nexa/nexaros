/**
 * useOrderNotifications — React hook that shows browser notifications
 * when the order status changes, using the WebSocket event stream.
 *
 * Usage: call alongside useOrderSocket in any order tracking page.
 * The hook shares the same event callbacks pattern.
 */
import { useEffect, useRef } from 'react';
import {
  requestNotificationPermission,
  notifyOrderReady,
  notifyOrderStatusChange,
  notifyItemPreparing,
  notifyItemReady,
} from '@/lib/notifications';

interface UseOrderNotificationsOptions {
  /** The order ID for identifying notifications */
  orderId: string;
  /** The order number for notification messages */
  orderNumber: number;
  /** Optional restaurant slug for notification click-to-track links */
  slug?: string;
  /** Whether notifications are enabled at all */
  enabled?: boolean;
  /** Called to check current status — prevents spamming notifications on initial connect */
  initialStatus?: string;
  /** Called to check if a specific item is already ready — prevents spamming */
  initialItemStatuses?: Record<string, string>;
}

/**
 * Hook that triggers browser notifications when order status changes.
 *
 * Designed to be used alongside `useOrderSocket` — you pass the
 * `onStatusChange` and `onItemStatusChange` callbacks to the socket hook,
 * and this hook manages the notification side-effects.
 *
 * Returns callback handlers that should be passed to useOrderSocket.
 */
export function useOrderNotifications(options: UseOrderNotificationsOptions) {
  const { orderId, orderNumber, slug, enabled = true, initialStatus, initialItemStatuses } = options;
  const hasSeenReadyRef = useRef(initialStatus === 'READY' || initialStatus === 'COMPLETED' || initialStatus === 'DELIVERED');
  const seenItemStatusesRef = useRef<Record<string, string>>(initialItemStatuses || {});

  // Request permission on mount
  useEffect(() => {
    if (!enabled) return;
    requestNotificationPermission();
  }, [enabled]);

  // Handler for order-level status changes
  const onStatusChange = (data: { orderId: string; orderNumber: number; status: string }) => {
    if (!enabled) return;

    // Don't re-notify if we already saw this status via initial fetch
    if (data.status === 'READY' && hasSeenReadyRef.current) return;

    if (data.status === 'READY' || data.status === 'COMPLETED') {
      hasSeenReadyRef.current = true;
    }

    notifyOrderStatusChange(data.orderNumber, data.status, orderId, slug);
  };

  // Handler for order:ready event
  const onOrderReady = (data: { orderId: string; orderNumber: number }) => {
    if (!enabled) return;
    if (hasSeenReadyRef.current) return;
    hasSeenReadyRef.current = true;
    notifyOrderReady(data.orderNumber, orderId, slug);
  };

  // Handler for item-level status changes
  const onItemStatusChange = (data: {
    orderId: string;
    orderNumber: number;
    itemId: string;
    itemName: string;
    status: string;
    quantity: number;
  }) => {
    if (!enabled) return;

    const prevStatus = seenItemStatusesRef.current[data.itemId];
    seenItemStatusesRef.current[data.itemId] = data.status;

    // Don't notify if item was already in this state via initial fetch
    if (prevStatus === data.status) return;

    if (data.status === 'PREPARING') {
      notifyItemPreparing(data.orderNumber, data.itemName, orderId, slug);
    } else if (data.status === 'READY' || data.status === 'SERVED') {
      notifyItemReady(data.orderNumber, data.itemName, orderId, slug);
    }
  };

  // Initialise the seenItemStatusesRef when initialItemStatuses changes
  useEffect(() => {
    if (initialItemStatuses) {
      seenItemStatusesRef.current = { ...seenItemStatusesRef.current, ...initialItemStatuses };
    }
  }, [initialItemStatuses]);

  return { onStatusChange, onOrderReady, onItemStatusChange };
}
