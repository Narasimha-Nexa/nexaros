'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Bell, Check, CheckCheck, Settings, Filter } from 'lucide-react';

const mockNotifications = [
  { id: '1', title: 'New tenant registered', message: 'Spice Bazaar from Bangalore just signed up for a trial', time: '2 min ago', read: false, type: 'info' },
  { id: '2', title: 'Payment received', message: '₹4,999 payment from Pizza Palace for Professional plan', time: '15 min ago', read: false, type: 'success' },
  { id: '3', title: 'Support ticket opened', message: 'TK-1234: Payment gateway not responding (High priority)', time: '1 hour ago', read: false, type: 'warning' },
  { id: '4', title: 'Subscription expiring', message: '12 trials expiring in the next 3 days', time: '2 hours ago', read: true, type: 'warning' },
  { id: '5', title: 'System alert', message: 'High memory usage on Background Jobs service', time: '3 hours ago', read: true, type: 'error' },
  { id: '6', title: 'Plan upgraded', message: 'Food Court Express upgraded from Starter to Professional', time: '5 hours ago', read: true, type: 'success' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => {
    setNotifications(n => n.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Notifications" actions={<>{unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck size={14} /> Mark All Read ({unreadCount})</Button>}<Button variant="outline" size="sm"><Settings size={14} /> Preferences</Button></>} />
      <div className="divider-heavy" />
      <div className="divider-heavy" />

      <Card>
        <div className="divide-y divide-hairline">
          {notifications.map((notif) => (
            <div key={notif.id} className={`flex items-start gap-3 py-4 ${!notif.read ? 'bg-canvas-soft -mx-6 px-6' : ''}`}>
              <div className="mt-1 shrink-0">
                {!notif.read ? (
                  <span className="block w-2 h-2 bg-ink rounded-full" />
                ) : (
                  <span className="block w-2 h-2" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-body-sm font-sans font-semibold">{notif.title}</p>
                  <Badge variant={notif.type === 'error' || notif.type === 'warning' ? 'filled' : 'outline'}>{notif.type}</Badge>
                </div>
                <p className="text-body-sm text-body font-sans mt-0.5">{notif.message}</p>
                <p className="text-caption text-body font-sans mt-1">{notif.time}</p>
              </div>
              {!notif.read && (
                <button
                  onClick={() => setNotifications(n => n.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                  className="btn-ghost btn-sm p-1.5 shrink-0"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
