'use client';

import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface InsightCardProps {
  title: string;
  value: string;
  change?: number;
  type?: 'positive' | 'negative' | 'warning' | 'info';
  recommendation?: string;
}

export function InsightCard({ title, value, change, type = 'info', recommendation }: InsightCardProps) {
  const icons = {
    positive: <TrendingUp size={14} className="text-success" />,
    negative: <TrendingDown size={14} className="text-danger" />,
    warning: <AlertTriangle size={14} className="text-warning" />,
    info: <Lightbulb size={14} className="text-info" />,
  };

  const borderColors = {
    positive: 'border-l-success',
    negative: 'border-l-danger',
    warning: 'border-l-warning',
    info: 'border-l-info',
  };

  return (
    <div className={`p-3 border border-hairline border-l-4 ${borderColors[type]} bg-canvas`}>
      <div className="flex items-center gap-2 mb-1">
        {icons[type]}
        <span className="text-xs font-medium text-ink">{title}</span>
      </div>
      <p className="text-sm font-display font-semibold text-ink">{value}</p>
      {change !== undefined && (
        <p className={`text-xs mt-0.5 ${change >= 0 ? 'text-success' : 'text-danger'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs previous period
        </p>
      )}
      {recommendation && (
        <p className="text-[11px] text-body mt-1.5 flex items-start gap-1">
          <Lightbulb size={10} className="text-primary mt-0.5 shrink-0" />
          {recommendation}
        </p>
      )}
    </div>
  );
}
