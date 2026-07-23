'use client';
import React from 'react';
import { adminApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useWebsiteBuilderStore } from '@/stores/website-builder.store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertCircle, Clock } from 'lucide-react';

interface SeoScoreCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface SeoScoreData {
  score: number;
  checks: SeoScoreCheck[];
  status: 'good' | 'needs-improvement' | 'poor';
}

export function SeoScorePanel({ tenantId }: { tenantId: string }) {
  const { draft } = useWebsiteBuilderStore();

  const { data, isLoading, refetch } = useQuery<SeoScoreData>({
    queryKey: ['website-seo-score', tenantId],
    queryFn: () => adminApi.getSeoScore(tenantId),
    refetchInterval: 30000,
  });

  const score = data?.score ?? 0;
  const checks = data?.checks ?? [];
  const status = data?.status ?? 'poor';

  const getStatusColor = () => {
    if (status === 'good') return 'text-green-600';
    if (status === 'needs-improvement') return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusBg = () => {
    if (status === 'good') return 'bg-green-100';
    if (status === 'needs-improvement') return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getStatusText = () => {
    if (status === 'good') return 'Good';
    if (status === 'needs-improvement') return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Card className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-ink">SEO Score</h3>
          <Badge className={getStatusBg()} variant="soft">
            {getStatusText()}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke={getStatusColor().replace('text-', '')}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(score / 100) * 201} 201`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getStatusColor()}`}>{score}</span>
            </div>
          </div>
          <div className="flex-1 text-sm text-ink/60">
            <p>Based on {checks.filter((c) => c.passed).length} of {checks.length} checks passed</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              className="mt-2 h-8 px-3"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {checks.map((check, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-ink/5 transition-colors"
          >
            <div
              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                check.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}
            >
              {check.passed ? <Check size={12} /> : <X size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">{check.name}</p>
              <p className="text-xs text-ink/50">{check.message}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Button({ size = 'sm', variant = 'primary', children, onClick, className = '', isLoading }: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
}) {
  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    ghost: 'bg-transparent hover:bg-ink/5',
    outline: 'border border-ink/20 hover:bg-ink/5',
    danger: 'bg-danger text-white hover:bg-danger/90',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  const variantClass = variants[variant!] || variants.primary;
  const sizeClass = sizes[size!] || sizes.sm;
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${variantClass} ${sizeClass} ${className}`}
    >
      {isLoading ? <span className="animate-spin">⏳</span> : children}
    </button>
  );
}