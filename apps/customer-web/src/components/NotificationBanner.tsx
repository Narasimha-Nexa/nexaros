'use client';

import { useState, useEffect } from 'react';
import { Bell, BellRing, X, Shield, Settings, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

const DISMISSED_KEY = 'nexaros-notif-banner-dismissed';

interface NotificationBannerProps {
  /** Unique ID for this instance (e.g. the orderId) so dismiss is scoped */
  id: string;
  /** Optional order number to show in the message */
  orderNumber?: number;
  /** The slug for the notification click-to-track link */
  slug?: string;
  className?: string;
}

type BannerState = 'loading' | 'show-prompt' | 'show-denied' | 'granted' | 'dismissed';

/**
 * A beautiful, non-intrusive banner that asks users to enable browser notifications
 * for order status updates. Appears at the top of order tracking pages.
 *
 * States:
 *  - prompt: Default — asks user to enable notifications
 *  - denied: Notifications are blocked — explains how to re-enable
 *  - granted: Already allowed — hides automatically
 *  - dismissed: User clicked "Maybe Later" — hides permanently (per order)
 */
export default function NotificationBanner({
  id,
  orderNumber,
  className,
}: NotificationBannerProps) {
  const [bannerState, setBannerState] = useState<BannerState>('loading');
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBannerState('dismissed');
      return;
    }

    // Check if dismissed for this order
    try {
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
      if (dismissed[id]) {
        setBannerState('dismissed');
        return;
      }
    } catch { /* ignore */ }

    // Determine current permission state
    if (Notification.permission === 'granted') {
      setBannerState('granted');
    } else if (Notification.permission === 'denied') {
      setBannerState('show-denied');
    } else {
      setBannerState('show-prompt');
    }
  }, [id]);

  const handleEnable = async () => {
    if (enabling) return;
    setEnabling(true);

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setBannerState('granted');
      } else if (result === 'denied') {
        setBannerState('show-denied');
      }
    } catch {
      // Permission request failed — keep showing prompt
    }

    setEnabling(false);
  };

  const handleDismiss = () => {
    setBannerState('dismissed');
    try {
      const dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
      dismissed[id] = true;
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    } catch { /* ignore */ }
  };

  if (bannerState === 'loading' || bannerState === 'granted' || bannerState === 'dismissed') {
    return null;
  }

  const isDenied = bannerState === 'show-denied';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 sm:p-5 mb-6 animate-fade-in-down',
        'transition-all duration-500 ease-out',
        isDenied
          ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50'
          : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-blue-100 dark:from-blue-950/40 dark:via-ink dark:to-indigo-950/30 dark:border-blue-900/40',
        className,
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 w-24 h-24 opacity-5 dark:opacity-10">
        <BellRing className="w-full h-full" />
      </div>

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
            isDenied
              ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
          )}
        >
          {isDenied ? <Shield size={20} /> : <Bell size={20} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-ink text-sm sm:text-base">
                {isDenied ? 'Notifications are blocked' : 'Stay Updated'}
              </h3>
              <p className="text-xs sm:text-sm text-body mt-0.5 max-w-lg">
                {isDenied
                  ? `You won't get notified when Order #${orderNumber} is ready. Enable notifications in your browser settings to receive real-time updates.`
                  : `Get notified when Order #${orderNumber} status changes — even if you leave this page.`
                }
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 rounded-lg text-body/50 hover:text-ink hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {isDenied ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Open browser settings page for notification permissions
                    if (typeof window !== 'undefined' && 'Notification' in window) {
                      // Most browsers don't have a direct link, but we can try
                      window.open('about:settings', '_blank');
                    }
                    handleDismiss();
                  }}
                  className="gap-1.5"
                >
                  <Settings size={14} />
                  Open Settings
                </Button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-body hover:text-ink transition-colors"
                >
                  Dismiss
                </button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={handleEnable}
                  loading={enabling}
                  className="gap-1.5 shadow-sm"
                >
                  <BellRing size={14} />
                  Enable Notifications
                  <ArrowRight size={14} />
                </Button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-body hover:text-ink transition-colors px-2 py-1"
                >
                  Maybe later
                </button>
              </>
            )}
          </div>

          {!isDenied && (
            <p className="text-[10px] text-body/60 mt-2 flex items-center gap-1">
              <Shield size={10} />
              Your permission is requested only once. You can change this anytime in browser settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
