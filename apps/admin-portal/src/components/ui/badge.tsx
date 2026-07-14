'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'filled' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'outline', size = 'sm', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variant === 'filled' && 'badge-filled',
        variant === 'outline' && 'badge-outline',
        size === 'md' && 'px-3 py-1 text-xs',
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const getVariant = () => {
    const s = status.toLowerCase();
    if (['active', 'online', 'success', 'completed', 'paid', 'approved'].includes(s)) return 'filled';
    if (['inactive', 'offline', 'error', 'failed', 'cancelled', 'rejected', 'suspended'].includes(s)) return 'outline';
    return 'outline';
  };
  return <Badge variant={getVariant()}>{label || status}</Badge>;
}
