'use client';
import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';

interface KitchenOrderEvent {
  orderId: string;
  orderNumber: number;
  status: string;
  tableNumber?: number;
  items?: Array<{ id: string; name: string; quantity: number; status: string }>;
}

interface KitchenItemStatusEvent {
  orderId: string;
  orderNumber: number;
  itemId: string;
  itemName: string;
  status: string;
  quantity: number;
}

interface UseKitchenSocketOptions {
  branchId: string;
  token: string;
  onOrderCreated?: (data: KitchenOrderEvent) => void;
  onOrderBumped?: (data: KitchenOrderEvent) => void;
  onOrderAssigned?: (data: { orderId: string; orderNumber: number; chefId: string; chefName: string }) => void;
  onPriorityChanged?: (data: { orderId: string; orderNumber: number; priority: string }) => void;
  onItemStatusChanged?: (data: KitchenItemStatusEvent) => void;
  enabled?: boolean;
}

/**
 * Real-time kitchen socket hook for admin portal.
 * Subscribes to kitchen-specific Socket.IO events on the branch room.
 */
export function useKitchenSocket({
  branchId,
  token,
  onOrderCreated,
  onOrderBumped,
  onOrderAssigned,
  onPriorityChanged,
  onItemStatusChanged,
  enabled = true,
}: UseKitchenSocketOptions) {
  const onOrderCreatedRef = useRef(onOrderCreated);
  const onOrderBumpedRef = useRef(onOrderBumped);
  const onOrderAssignedRef = useRef(onOrderAssigned);
  const onPriorityChangedRef = useRef(onPriorityChanged);
  const onItemStatusChangedRef = useRef(onItemStatusChanged);

  useEffect(() => { onOrderCreatedRef.current = onOrderCreated; }, [onOrderCreated]);
  useEffect(() => { onOrderBumpedRef.current = onOrderBumped; }, [onOrderBumped]);
  useEffect(() => { onOrderAssignedRef.current = onOrderAssigned; }, [onOrderAssigned]);
  useEffect(() => { onPriorityChangedRef.current = onPriorityChanged; }, [onPriorityChanged]);
  useEffect(() => { onItemStatusChangedRef.current = onItemStatusChanged; }, [onItemStatusChanged]);

  useEffect(() => {
    if (!branchId || !token || !enabled) return;

    const s = getSocket(token);

    function onConnect() {
      s.emit('join:branch', { branchId });
    }

    function onKitchenOrderCreated(data: unknown) {
      onOrderCreatedRef.current?.(data as KitchenOrderEvent);
    }

    function onKitchenOrderBumped(data: unknown) {
      onOrderBumpedRef.current?.(data as KitchenOrderEvent);
    }

    function onKitchenOrderAssigned(data: unknown) {
      onOrderAssignedRef.current?.(data as { orderId: string; orderNumber: number; chefId: string; chefName: string });
    }

    function onKitchenPriorityChanged(data: unknown) {
      onPriorityChangedRef.current?.(data as { orderId: string; orderNumber: number; priority: string });
    }

    function onKitchenItemStatus(data: unknown) {
      onItemStatusChangedRef.current?.(data as KitchenItemStatusEvent);
    }

    s.on('connect', onConnect);
    s.on('kitchen:order-created', onKitchenOrderCreated);
    s.on('kitchen:order-bumped', onKitchenOrderBumped);
    s.on('kitchen:order-assigned', onKitchenOrderAssigned);
    s.on('kitchen:priority-changed', onKitchenPriorityChanged);
    s.on('item:status-changed', onKitchenItemStatus);
    s.on('order:status-changed', onKitchenOrderBumped);

    if (s.connected) {
      s.emit('join:branch', { branchId });
    }

    return () => {
      s.off('connect', onConnect);
      s.off('kitchen:order-created', onKitchenOrderCreated);
      s.off('kitchen:order-bumped', onKitchenOrderBumped);
      s.off('kitchen:order-assigned', onKitchenOrderAssigned);
      s.off('kitchen:priority-changed', onKitchenPriorityChanged);
      s.off('item:status-changed', onKitchenItemStatus);
      s.off('order:status-changed', onKitchenOrderBumped);
    };
  }, [branchId, token, enabled]);
}
