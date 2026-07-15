/**
 * Browser Notification utilities — wraps the Notification API for order updates.
 *
 * Features:
 *  - Requests permission once, remembers the decision
 *  - Cooldown prevents notification spam (same status not re-notified within 60s)
 *  - Degrades gracefully when notifications are unsupported or denied
 *  - Shows different icons/messages for different event types
 */

const NOTIFICATION_COOLDOWN_MS = 60_000;
const NOTIFICATION_ICON = '/icons/icon-192.png';

// ── Permission management ──

let permissionGranted: boolean | null = null;

/**
 * Request notification permission from the user.
 * Returns `true` if granted, `false` if denied or unsupported.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    permissionGranted = false;
    return false;
  }

  if (permissionGranted !== null) return permissionGranted;

  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return true;
  }

  if (Notification.permission === 'denied') {
    permissionGranted = false;
    return false;
  }

  try {
    const result = await Notification.requestPermission();
    permissionGranted = result === 'granted';
    return permissionGranted;
  } catch {
    permissionGranted = false;
    return false;
  }
}

/**
 * Check if notifications are currently allowed.
 */
export function canNotify(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

// ── Cooldown tracking ──

const notifiedKeys = new Map<string, number>();

function isOnCooldown(key: string): boolean {
  const lastNotified = notifiedKeys.get(key);
  if (!lastNotified) return false;
  return Date.now() - lastNotified < NOTIFICATION_COOLDOWN_MS;
}

function markNotified(key: string) {
  notifiedKeys.set(key, Date.now());
}

// ── Show notification ──

export interface OrderNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  orderId?: string;
  /** Clicking the notification navigates to this URL */
  href?: string;
}

/**
 * Show a browser notification if permission has been granted.
 * Uses a tag-based cooldown so the same notification isn't shown repeatedly.
 * Returns `true` if the notification was shown.
 */
export function showOrderNotification(options: OrderNotificationOptions): boolean {
  if (!canNotify()) return false;

  const tag = options.tag || options.title;
  if (isOnCooldown(tag)) return false;
  markNotified(tag);

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || NOTIFICATION_ICON,
      tag,
      requireInteraction: true,
      silent: false,
    });

    if (options.href) {
      notification.onclick = () => {
        window.focus();
        window.open(options.href!, '_self');
        notification.close();
      };
    }

    // Auto-close after 8 seconds
    setTimeout(() => notification.close(), 8000);

    return true;
  } catch {
    return false;
  }
}

/**
 * Convenience: show a notification that an order is ready (most important event).
 */
export function notifyOrderReady(
  orderNumber: number,
  orderId: string,
  slug?: string,
) {
  const href = slug ? `/${slug}/order/${orderId}` : undefined;
  return showOrderNotification({
    title: '🎉 Order Ready!',
    body: `Order #${orderNumber} is ready to be served!`,
    tag: `order-ready-${orderId}`,
    orderId,
    href,
  });
}

/**
 * Show notification that order status changed to a meaningful new status.
 */
export function notifyOrderStatusChange(
  orderNumber: number,
  status: string,
  orderId: string,
  slug?: string,
) {
  const statusMessages: Record<string, { title: string; body: string }> = {
    CONFIRMED: {
      title: '✅ Order Confirmed',
      body: `Order #${orderNumber} has been confirmed! The kitchen will start preparing shortly.`,
    },
    PREPARING: {
      title: '👨‍🍳 Being Prepared',
      body: `Order #${orderNumber} is now being prepared by our chefs!`,
    },
    READY: {
      title: '🎉 Order Ready!',
      body: `Order #${orderNumber} is ready to be served!`,
    },
    OUT_FOR_DELIVERY: {
      title: '🚚 Out for Delivery',
      body: `Order #${orderNumber} is on its way!`,
    },
    DELIVERED: {
      title: '✅ Delivered',
      body: `Order #${orderNumber} has been delivered. Enjoy your meal!`,
    },
    CANCELLED: {
      title: '❌ Order Cancelled',
      body: `Order #${orderNumber} has been cancelled.`,
    },
  };

  const msg = statusMessages[status];
  if (!msg) return false;

  const href = slug ? `/${slug}/order/${orderId}` : undefined;
  return showOrderNotification({
    title: msg.title,
    body: msg.body,
    tag: `order-status-${orderId}-${status}`,
    orderId,
    href,
  });
}

/**
 * Show notification when an item starts being prepared.
 */
export function notifyItemPreparing(
  orderNumber: number,
  itemName: string,
  orderId: string,
  slug?: string,
) {
  const href = slug ? `/${slug}/order/${orderId}` : undefined;
  return showOrderNotification({
    title: '🍳 Item in Progress',
    body: `${itemName} from Order #${orderNumber} is now being prepared.`,
    tag: `item-preparing-${orderId}-${itemName}`,
    orderId,
    href,
  });
}

/**
 * Show notification when an item is ready.
 */
export function notifyItemReady(
  orderNumber: number,
  itemName: string,
  orderId: string,
  slug?: string,
) {
  const href = slug ? `/${slug}/order/${orderId}` : undefined;
  return showOrderNotification({
    title: '✅ Item Ready',
    body: `${itemName} from Order #${orderNumber} is ready!`,
    tag: `item-ready-${orderId}-${itemName}`,
    orderId,
    href,
  });
}
