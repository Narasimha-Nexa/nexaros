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
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-caption font-sans font-semibold tracking-[0.15em] uppercase text-body mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-display-sm sm:text-display-md truncate">{title}</h1>
        {description && (
          <p className="text-body-sm text-body font-sans mt-1">{description}</p>
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
