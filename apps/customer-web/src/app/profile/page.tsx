'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Package, Heart, MapPin, CreditCard, Star, Gift, Settings,
  LogOut, ChevronRight, Clock, Award, TrendingUp,
} from 'lucide-react';
import { Button, Card, Badge, Avatar, EmptyState, Divider } from '@/components/ui';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/store/auth-store';

const PROFILE_LINKS = [
  { href: '/profile/orders', icon: Package, label: 'Orders', desc: 'View order history', color: 'text-blue-500' },
  { href: '/profile/favorites', icon: Heart, label: 'Favorites', desc: 'Your wishlist', color: 'text-red-500' },
  { href: '/profile/address', icon: MapPin, label: 'Addresses', desc: 'Saved delivery addresses', color: 'text-green-500' },
  { href: '/profile/payment', icon: CreditCard, label: 'Payments', desc: 'Saved payment methods', color: 'text-purple-500' },
  { href: '/profile/reviews', icon: Star, label: 'Reviews', desc: 'Your reviews & ratings', color: 'text-yellow-500' },
  { href: '/profile/rewards', icon: Gift, label: 'Rewards', desc: 'Loyalty points & perks', color: 'text-orange-500' },
  { href: '/profile/reservations', icon: Clock, label: 'Reservations', desc: 'Your table bookings', color: 'text-teal-500' },
  { href: '/profile/settings', icon: Settings, label: 'Settings', desc: 'Preferences & notifications', color: 'text-gray-500' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, orderHistory, favorites } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <EmptyState icon="🔒" title="Please sign in" description="Sign in to access your profile" action={<Link href="/login"><Button>Sign In</Button></Link>} />
      </div>
    );
  }

  const TIER_COLORS = { bronze: 'bg-amber-600', silver: 'bg-gray-400', gold: 'bg-yellow-500', platinum: 'bg-purple-600' };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Profile Header */}
      <Card className="p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <Avatar src={user.avatar} alt={user.name} size="xl" />
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-ink">{user.name}</h1>
            <p className="text-body text-sm">{user.email} · {user.phone}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <Badge variant="primary">Member since {user.membershipSince.split('-')[0]}</Badge>
              <Badge className={TIER_COLORS[user.loyaltyTier]}>🏆 {user.loyaltyTier.charAt(0).toUpperCase() + user.loyaltyTier.slice(1)}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/profile/settings')}>
              <Settings size={16} /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-danger" onClick={logout}>
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { value: user.totalOrders, label: 'Total Orders', icon: Package },
          { value: user.loyaltyPoints, label: 'Loyalty Points', icon: Award },
          { value: orderHistory.length, label: 'Active Orders', icon: TrendingUp },
          { value: favorites.length, label: 'Favorites', icon: Heart },
        ].map((stat) => (
          <Card key={stat.label} className="text-center p-4">
            <stat.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold text-ink">{stat.value}</div>
            <div className="text-xs text-body">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROFILE_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center gap-4 p-4 rounded-xl border border-hairline hover:border-ink/30 hover:shadow-sm transition-all group">
            <div className={cn('w-10 h-10 rounded-xl bg-hairline flex items-center justify-center', link.color)}>
              <link.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-sm">{link.label}</p>
              <p className="text-xs text-body">{link.desc}</p>
            </div>
            <ChevronRight size={18} className="text-body group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      {orderHistory.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink">Recent Orders</h2>
            <Link href="/profile/orders" className="text-sm text-link hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {orderHistory.slice(0, 3).map((order) => (
              <Link key={order.id} href={`/orders`} className="flex items-center justify-between p-4 rounded-xl border border-hairline hover:shadow-sm transition-all">
                <div>
                  <p className="font-medium text-ink text-sm">Order #{order.orderNumber}</p>
                  <p className="text-xs text-body">{formatDate(order.createdAt)} · {order.items.length} items</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink text-sm">{formatPrice(order.totalAmount)}</p>
                  <Badge variant={order.status === 'DELIVERED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'}>{order.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
