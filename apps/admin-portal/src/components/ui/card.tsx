'use client';
import { cn } from '@/lib/utils';
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ variant = 'default', padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        variant === 'elevated' && 'card-elevated',
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-3 sm:p-4',
        padding === 'md' && 'p-4 sm:p-5',
        padding === 'lg' && 'p-6 sm:p-8',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className="text-display-xs font-sans" {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}
