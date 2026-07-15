/**
 * Socket.IO Client — public namespace connection for real-time order tracking.
 *
 * Connects to the backend's /public WebSocket namespace.
 * No authentication required — clients only need the order ID (a UUID).
 */
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

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

  // Keep refs in sync without triggering re-renders
  useEffect(() => {
    statusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    orderReadyRef.current = onOrderReady;
  }, [onOrderReady]);

  useEffect(() => {
    itemStatusChangeRef.current = onItemStatusChange;
  }, [onItemStatusChange]);

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

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('order:status-changed', onStatusChange);
    s.on('order:ready', onOrderReady);
    s.on('item:status-changed', onItemStatusChange);

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

      if (s.connected) {
        s.emit('leave:order', { orderId });
      }

      releaseSocket();
      setIsConnected(false);
    };
  }, [orderId, enabled]);

  return { isConnected, lastEvent };
}
