'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTenantSocket } from '@/lib/socket';

/**
 * Subscribes to tenant-level real-time Socket.IO events and triggers a
 * Next.js soft-refresh (router.refresh) when the restaurant owner updates
 * menu, website config, offers, gallery, or announcements.
 *
 * Uses the existing reference-counted socket connection from lib/socket.ts.
 */
export function useRealtimeData(slug: string) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  // Debounce: coalesce rapid bursts of events into a single refresh.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(refresh, 500);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useTenantSocket({
    slug,
    onMenuUpdated: debouncedRefresh,
    onRestaurantUpdated: debouncedRefresh,
    onOfferUpdated: debouncedRefresh,
    onAnnouncementUpdated: debouncedRefresh,
    onGalleryUpdated: debouncedRefresh,
    onWebsiteUpdated: debouncedRefresh,
  });
}
