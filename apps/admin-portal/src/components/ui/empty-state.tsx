'use client';
import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-body">{icon || <Inbox size={48} strokeWidth={1} />}</div>
      <h3 className="text-display-xs font-sans mb-2">{title}</h3>
      {description && <p className="text-body-sm text-body max-w-sm font-sans mb-6">{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
