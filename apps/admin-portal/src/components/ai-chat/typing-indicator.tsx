'use client';

import React from 'react';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
      <span className="text-xs text-body">Nexa is thinking...</span>
    </div>
  );
}

export function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-body">
      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      <span>Analyzing business data...</span>
    </div>
  );
}
