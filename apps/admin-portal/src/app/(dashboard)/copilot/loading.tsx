'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function CopilotLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-primary font-medium">Intelligence</p>
            <h1 className="text-xl font-display font-semibold text-ink">AI Business Copilot</h1>
          </div>
          <div className="w-24 h-8 bg-canvas-soft border border-hairline animate-pulse" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden mx-4 mt-2 mb-4 border border-hairline">
        <div className="w-64 border-r border-hairline bg-canvas p-3 animate-pulse">
          <div className="h-4 bg-canvas-soft border border-hairline mb-3 w-32" />
          <div className="h-7 bg-canvas-soft border border-hairline mb-2" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-canvas-soft border border-hairline mb-1" />
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles size={20} className="text-primary animate-pulse" />
          </div>
          <div className="h-4 bg-canvas-soft border border-hairline w-48 mb-2 animate-pulse" />
          <div className="h-3 bg-canvas-soft border border-hairline w-64 animate-pulse" />
        </div>

        <div className="w-64 border-l border-hairline bg-canvas p-3 animate-pulse hidden xl:block">
          <div className="h-4 bg-canvas-soft border border-hairline mb-3 w-36" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-canvas-soft border border-hairline mb-1.5" />
          ))}
        </div>
      </div>
    </div>
  );
}
