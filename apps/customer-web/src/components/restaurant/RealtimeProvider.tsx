'use client';
import { useRealtimeData } from '@/hooks/use-realtime-data';

/**
 * Client component that activates real-time Socket.IO updates for the
 * current restaurant tenant. Mount this in the restaurant slug layout
 * so every page under /restaurant/:slug automatically refreshes when
 * the owner changes menu, offers, gallery, announcements, or website config.
 */
export function RealtimeProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  useRealtimeData(slug);
  return <>{children}</>;
}
