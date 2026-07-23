'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[12px] font-sans font-semibold tracking-[0.15em] uppercase text-body mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] sm:text-[26px] font-display font-semibold text-ink truncate" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {description && (
          <p className="text-[13px] text-body font-sans mt-1 break-all leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

interface PageSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function PageSection({ title, children, className }: PageSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && <h2 className="text-display-xs font-sans">{title}</h2>}
      {children}
    </div>
  );
}
