'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'filled' | 'outline' | 'soft' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'outline', size = 'sm', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variant === 'filled' && 'badge-filled',
        variant === 'outline' && 'badge-outline',
        variant === 'soft' && 'badge-soft',
        variant === 'success' && 'badge-success',
        variant === 'warning' && 'badge-warning',
        variant === 'danger' && 'badge-danger',
        variant === 'info' && 'badge-info',
        size === 'md' && 'px-3 py-1.5 text-xs',
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const getVariant = (): BadgeProps['variant'] => {
    const s = status.toLowerCase();
    if (['active', 'online', 'success', 'completed', 'paid', 'approved', 'verified', 'enabled'].includes(s)) return 'success';
    if (['pending', 'processing', 'in_progress', 'waiting'].includes(s)) return 'warning';
    if (['inactive', 'offline', 'error', 'failed', 'cancelled', 'rejected', 'suspended', 'disabled', 'banned'].includes(s)) return 'danger';
    if (['info', 'draft', 'trial', 'setup'].includes(s)) return 'info';
    return 'outline';
  };
  return <Badge variant={getVariant()}>{label || status}</Badge>;
}
