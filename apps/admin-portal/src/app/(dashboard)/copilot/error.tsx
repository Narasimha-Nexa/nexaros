'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CopilotError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-danger" />
      </div>
      <h2 className="text-lg font-display font-semibold text-ink mb-1">Something went wrong</h2>
      <p className="text-sm text-body text-center max-w-md mb-4">
        The AI Copilot encountered an unexpected error. Please try again.
      </p>
      {error.message && (
        <p className="text-xs text-caption bg-canvas-soft border border-hairline px-3 py-2 mb-4 max-w-md font-mono">
          {error.message}
        </p>
      )}
      <Button onClick={reset} variant="outline" size="sm">
        Try again
      </Button>
    </div>
  );
}
