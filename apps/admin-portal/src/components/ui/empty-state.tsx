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
    <div className="empty-state">
      <div className="empty-state-icon">{icon || <Inbox size={48} strokeWidth={1} />}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description mb-6">{description}</p>}
      {action && <Button size="sm" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
