'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export function StatCard({ label, value, change, changeType = 'neutral', className }: StatCardProps) {
  return (
    <div className={cn('card hover:shadow-sm transition-shadow', className)}>
      <p className="stat-label mb-1.5">{label}</p>
      <p className="stat-value">{value}</p>
      {change && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-sans',
          changeType === 'positive' && 'stat-change-positive',
          changeType === 'negative' && 'stat-change-negative',
          changeType === 'neutral' && 'text-body'
        )}>
          {changeType === 'positive' && <TrendingUp size={12} />}
          {changeType === 'negative' && <TrendingDown size={12} />}
          {changeType === 'neutral' && <Minus size={12} />}
          <span>{change}</span>
        </div>
      )}
    </div>
  );
}
