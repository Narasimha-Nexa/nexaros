'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { useToastStore } from '@/stores/ui.store';
import { adminApi } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { Bell, Check, CheckCheck, Settings, RefreshCw } from 'lucide-react';

interface Notification {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  newData?: any;
  ipAddress?: string;
  readAt?: string | null;
  createdAt: string;
  adminUser?: { name: string; email: string };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifsRes, countRes] = await Promise.all([
        adminApi.getNotifications(50),
        adminApi.getUnreadNotificationCount(),
      ]);
      setNotifications(notifsRes.notifications || notifsRes.data || []);
      setUnreadCount(countRes.unreadCount || 0);
    } catch (err: any) {
      addToast(err.message || 'Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await adminApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
      setUnreadCount(0);
      addToast('All notifications marked as read', 'success');
    } catch {}
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Notifications"
        actions={
          <>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck size={14} /> Mark All Read ({unreadCount})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchNotifications}>
              <RefreshCw size={14} /> Refresh
            </Button>
          </>
        }
      />
      <div className="divider-heavy" />

      {loading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <Card key={i} className="h-16 animate-pulse" />)}</div>
      ) : notifications.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Bell size={32} className="mx-auto mb-3 text-body" />
          <p className="text-body-sm text-body font-sans">No notifications yet.</p>
          <p className="text-caption text-body font-sans mt-1">Activity from admin actions will appear here.</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-hairline">
            {notifications.map((notif) => {
              const isRead = !!notif.readAt;
              const detail = notif.newData as any;
              return (
                <div key={notif.id} className={`flex items-start gap-3 py-4 ${!isRead ? 'bg-canvas-soft -mx-6 px-6' : ''}`}>
                  <div className="mt-1 shrink-0">
                    {!isRead ? (
                      <span className="block w-2 h-2 bg-ink rounded-full" />
                    ) : (
                      <span className="block w-2 h-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-sans font-semibold">{formatAction(notif.action)}</p>
                      <Badge variant={notif.entity ? 'outline' : 'outline'}>{notif.entity || 'system'}</Badge>
                    </div>
                    {detail && (
                      <p className="text-body-sm text-body font-sans mt-0.5">
                        {typeof detail === 'object' ? (detail.restaurantName || detail.title || JSON.stringify(detail).slice(0, 100)) : String(detail)}
                      </p>
                    )}
                    <p className="text-caption text-body font-sans mt-1">
                      {timeAgo(notif.createdAt)} · {notif.adminUser?.name || notif.adminUser?.email || 'System'}
                    </p>
                  </div>
                  {!isRead && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="btn-ghost btn-sm p-1.5 shrink-0"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
