/**
 * Socket.IO Client — public namespace connection for real-time order tracking.
 *
 * Connects to the backend's /public WebSocket namespace.
 * No authentication required — clients only need the order ID (a UUID).
 */
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (() => {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      return 'http://localhost:4000';
    }
  })();

// ── Socket connection management ──

let socket: Socket | null = null;
let connectionCount = 0;

/**
 * Get or create the shared Socket.IO connection to the /public namespace.
 * The connection is reference-counted so it stays alive as long as
 * at least one component is using it.
 */
export function getPublicSocket(): Socket {
  if (!socket?.connected) {
    socket = io(`${SOCKET_URL}/public`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to /public namespace');
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }

  return socket;
}

/**
 * Increment the reference count and return the socket.
 * Call `releaseSocket()` when the component unmounts.
 */
export function acquireSocket(): Socket {
  connectionCount++;
  return getPublicSocket();
}

/**
 * Decrement the reference count. When it reaches 0, disconnect.
 */
export function releaseSocket(): void {
  connectionCount = Math.max(0, connectionCount - 1);
  if (connectionCount === 0 && socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}

// ── React Hook ──

interface UseOrderSocketOptions {
  orderId: string;
  onStatusChange?: (data: {
    orderId: string;
    orderNumber: number;
    status: string;
    tableNumber?: number;
  }) => void;
  onOrderReady?: (data: {
    orderId: string;
    orderNumber: number;
    tableNumber?: number;
  }) => void;
  /** Called when a specific item's status changes (e.g. kitchen starts preparing it) */
  onItemStatusChange?: (data: {
    orderId: string;
    orderNumber: number;
    itemId: string;
    itemName: string;
    status: string;
    quantity: number;
  }) => void;
  /** Called when the order is cancelled */
  onOrderCancelled?: (data: {
    orderId: string;
    orderNumber: number;
    status: string;
    notes?: string;
  }) => void;
  /** Called when items are added/removed from the order */
  onItemsChanged?: (data: {
    orderId: string;
    orderNumber: number;
    action: 'item_added' | 'item_removed';
    item: { id: string; name: string; quantity: number };
    totalAmount: number;
  }) => void;
  /** Called when a payment is received for this order */
  onPaymentReceived?: (data: {
    orderId: string;
    orderNumber: number;
    amount: number;
    method: string;
    totalPaid: number;
    remaining: number;
  }) => void;
  /** Called when a payment fails */
  onPaymentFailed?: (data: {
    orderId: string;
    orderNumber: number;
    amount: number;
    method: string;
    reason: string;
  }) => void;
  enabled?: boolean;
}

/**
 * Hook to connect to the order tracking socket and subscribe to real-time events.
 *
 * Automatically manages connection lifecycle — joins the order room on mount
 * and leaves on unmount. Falls back silently if socket connection fails.
 */
export function useOrderSocket({
  orderId,
  onStatusChange,
  onOrderReady,
  onItemStatusChange,
  onOrderCancelled,
  onItemsChanged,
  onPaymentReceived,
  onPaymentFailed,
  enabled = true,
}: UseOrderSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{
    type: string;
    data: Record<string, unknown>;
    timestamp: number;
  } | null>(null);

  const statusChangeRef = useRef(onStatusChange);
  const orderReadyRef = useRef(onOrderReady);
  const itemStatusChangeRef = useRef(onItemStatusChange);
  const orderCancelledRef = useRef(onOrderCancelled);
  const itemsChangedRef = useRef(onItemsChanged);
  const paymentReceivedRef = useRef(onPaymentReceived);
  const paymentFailedRef = useRef(onPaymentFailed);

  // Keep refs in sync without triggering re-renders
  useEffect(() => { statusChangeRef.current = onStatusChange; }, [onStatusChange]);
  useEffect(() => { orderReadyRef.current = onOrderReady; }, [onOrderReady]);
  useEffect(() => { itemStatusChangeRef.current = onItemStatusChange; }, [onItemStatusChange]);
  useEffect(() => { orderCancelledRef.current = onOrderCancelled; }, [onOrderCancelled]);
  useEffect(() => { itemsChangedRef.current = onItemsChanged; }, [onItemsChanged]);
  useEffect(() => { paymentReceivedRef.current = onPaymentReceived; }, [onPaymentReceived]);
  useEffect(() => { paymentFailedRef.current = onPaymentFailed; }, [onPaymentFailed]);

  useEffect(() => {
    if (!orderId || !enabled) return;

    let mounted = true;
    const s = acquireSocket();

    function onConnect() {
      if (!mounted) return;
      setIsConnected(true);

      s.emit('join:order', { orderId });
    }

    function onDisconnect() {
      if (!mounted) return;
      setIsConnected(false);
    }

    function onStatusChange(data: Record<string, unknown>) {
      if (!mounted) return;
      setLastEvent({ type: 'order:status-changed', data, timestamp: Date.now() });
      statusChangeRef.current?.(
        data as { orderId: string; orderNumber: number; status: string; tableNumber?: number },
      );
    }

    function onOrderReady(data: Record<string, unknown>) {
      if (!mounted) return;
      setLastEvent({ type: 'order:ready', data, timestamp: Date.now() });
      orderReadyRef.current?.(
        data as { orderId: string; orderNumber: number; tableNumber?: number },
      );
    }

    function onItemStatusChange(data: Record<string, unknown>) {
      if (!mounted) return;
      setLastEvent({ type: 'item:status-changed', data, timestamp: Date.now() });
      itemStatusChangeRef.current?.(
        data as {
          orderId: string;
          orderNumber: number;
          itemId: string;
          itemName: string;
          status: string;
          quantity: number;
        },
      );
    }

    function onOrderCancelled(data: Record<string, unknown>) {
      if (!mounted) return;
      setLastEvent({ type: 'order:cancelled', data, timestamp: Date.now() });
      orderCancelledRef.current?.(
        data as { orderId: string; orderNumber: number; status: string; notes?: string },
      );
    }

    function onItemsChanged(data: Record<string, unknown>) {
      if (!mounted) return;
      setLastEvent({ type: 'order:items-changed', data, timestamp: Date.now() });
      itemsChangedRef.current?.(
        data as {
          orderId: string;
          orderNumber: number;
          action: 'item_added' | 'item_removed';
          item: { id: string; name: string; quantity: number };
          totalAmount: number;
        },
      );
    }

    function onPaymentReceived(data: Record<string, unknown>) {
      if (!mounted) return;
      setLastEvent({ type: 'payment:received', data, timestamp: Date.now() });
      paymentReceivedRef.current?.(
        data as {
          orderId: string;
          orderNumber: number;
          amount: number;
          method: string;
          totalPaid: number;
          remaining: number;
        },
      );
    }

    function onPaymentFailed(data: Record<string, unknown>) {
      if (!mounted) return;
      setLastEvent({ type: 'payment:failed', data, timestamp: Date.now() });
      paymentFailedRef.current?.(
        data as {
          orderId: string;
          orderNumber: number;
          amount: number;
          method: string;
          reason: string;
        },
      );
    }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('order:status-changed', onStatusChange);
    s.on('order:ready', onOrderReady);
    s.on('item:status-changed', onItemStatusChange);
    s.on('order:cancelled', onOrderCancelled);
    s.on('order:items-changed', onItemsChanged);
    s.on('payment:received', onPaymentReceived);
    s.on('payment:failed', onPaymentFailed);

    // If already connected, join immediately
    if (s.connected) {
      setIsConnected(true);
      s.emit('join:order', { orderId });
    }

    return () => {
      mounted = false;
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('order:status-changed', onStatusChange);
      s.off('order:ready', onOrderReady);
      s.off('item:status-changed', onItemStatusChange);
      s.off('order:cancelled', onOrderCancelled);
      s.off('order:items-changed', onItemsChanged);
      s.off('payment:received', onPaymentReceived);
      s.off('payment:failed', onPaymentFailed);

      if (s.connected) {
        s.emit('leave:order', { orderId });
      }

      releaseSocket();
      setIsConnected(false);
    };
  }, [orderId, enabled]);

  return { isConnected, lastEvent };
}

// ── Tenant Socket Hook (for menu/restaurant/offer real-time sync) ──

interface UseTenantSocketOptions {
  /** The restaurant slug (e.g. "spice-garden") to subscribe to */
  slug: string;
  /** Called when any menu change happens (item created/updated/deleted, availability changed, etc.) */
  onMenuUpdated?: (data: { type: string; action: string }) => void;
  /** Called when the restaurant info changes (hours, status, banners, theme) */
  onRestaurantUpdated?: (data: Record<string, unknown>) => void;
  /** Called when offers change (created/updated/deleted) */
  onOfferUpdated?: (data: Record<string, unknown>) => void;
  /** Called when announcements change (created/updated/deleted) */
  onAnnouncementUpdated?: (data: Record<string, unknown>) => void;
  /** Called when gallery images change (created/updated/deleted) */
  onGalleryUpdated?: (data: Record<string, unknown>) => void;
  /** Called when website config changes (branding, theme, SEO, sections, legal) */
  onWebsiteUpdated?: (data: Record<string, unknown>) => void;
  enabled?: boolean;
}

/**
 * Hook to connect to the /public namespace and subscribe to tenant-level
 * real-time events such as menu updates, restaurant info changes, and offers.
 *
 * Joins `tenant:{slug}` room on mount and leaves on unmount.
 * The socket connection is shared with useOrderSocket via reference counting.
 */
export function useTenantSocket({
  slug,
  onMenuUpdated,
  onRestaurantUpdated,
  onOfferUpdated,
  onAnnouncementUpdated,
  onGalleryUpdated,
  onWebsiteUpdated,
  enabled = true,
}: UseTenantSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);

  const menuUpdatedRef = useRef(onMenuUpdated);
  const restaurantUpdatedRef = useRef(onRestaurantUpdated);
  const offerUpdatedRef = useRef(onOfferUpdated);
  const announcementUpdatedRef = useRef(onAnnouncementUpdated);
  const galleryUpdatedRef = useRef(onGalleryUpdated);
  const websiteUpdatedRef = useRef(onWebsiteUpdated);

  // Keep refs in sync without triggering re-renders
  useEffect(() => { menuUpdatedRef.current = onMenuUpdated; }, [onMenuUpdated]);
  useEffect(() => { restaurantUpdatedRef.current = onRestaurantUpdated; }, [onRestaurantUpdated]);
  useEffect(() => { offerUpdatedRef.current = onOfferUpdated; }, [onOfferUpdated]);
  useEffect(() => { announcementUpdatedRef.current = onAnnouncementUpdated; }, [onAnnouncementUpdated]);
  useEffect(() => { galleryUpdatedRef.current = onGalleryUpdated; }, [onGalleryUpdated]);
  useEffect(() => { websiteUpdatedRef.current = onWebsiteUpdated; }, [onWebsiteUpdated]);

  useEffect(() => {
    if (!slug || !enabled) return;

    let mounted = true;
    const s = acquireSocket();

    function onConnect() {
      if (!mounted) return;
      setIsConnected(true);
      s.emit('join:tenant', { slug });
    }

    function onDisconnect() {
      if (!mounted) return;
      setIsConnected(false);
    }

    function onMenuUpdated(data: Record<string, unknown>) {
      if (!mounted) return;
      menuUpdatedRef.current?.(data as { type: string; action: string });
    }

    function onRestaurantUpdated(data: Record<string, unknown>) {
      if (!mounted) return;
      restaurantUpdatedRef.current?.(data);
    }

    function onOfferUpdated(data: Record<string, unknown>) {
      if (!mounted) return;
      offerUpdatedRef.current?.(data);
    }

    function onAnnouncementUpdated(data: Record<string, unknown>) {
      if (!mounted) return;
      announcementUpdatedRef.current?.(data);
    }

    function onGalleryUpdated(data: Record<string, unknown>) {
      if (!mounted) return;
      galleryUpdatedRef.current?.(data);
    }

    function onWebsiteUpdated(data: Record<string, unknown>) {
      if (!mounted) return;
      websiteUpdatedRef.current?.(data);
    }

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('menu:updated', onMenuUpdated);
    s.on('restaurant:updated', onRestaurantUpdated);
    s.on('offer:updated', onOfferUpdated);
    s.on('offer:created', onOfferUpdated);
    s.on('offer:deleted', onOfferUpdated);
    s.on('announcement:updated', onAnnouncementUpdated);
    s.on('announcement:created', onAnnouncementUpdated);
    s.on('announcement:deleted', onAnnouncementUpdated);
    s.on('gallery:updated', onGalleryUpdated);
    s.on('gallery:created', onGalleryUpdated);
    s.on('gallery:deleted', onGalleryUpdated);
    s.on('website:updated', onWebsiteUpdated);
    s.on('website:published', onWebsiteUpdated);

    // If already connected, join immediately
    if (s.connected) {
      setIsConnected(true);
      s.emit('join:tenant', { slug });
    }

    return () => {
      mounted = false;
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('menu:updated', onMenuUpdated);
      s.off('restaurant:updated', onRestaurantUpdated);
      s.off('offer:updated', onOfferUpdated);
      s.off('offer:created', onOfferUpdated);
      s.off('offer:deleted', onOfferUpdated);
      s.off('announcement:updated', onAnnouncementUpdated);
      s.off('announcement:created', onAnnouncementUpdated);
      s.off('announcement:deleted', onAnnouncementUpdated);
      s.off('gallery:updated', onGalleryUpdated);
      s.off('gallery:created', onGalleryUpdated);
      s.off('gallery:deleted', onGalleryUpdated);
      s.off('website:updated', onWebsiteUpdated);
      s.off('website:published', onWebsiteUpdated);

      if (s.connected) {
        s.emit('leave:tenant', { slug });
      }

      releaseSocket();
      setIsConnected(false);
    };
  }, [slug, enabled]);

  return { isConnected };
}
