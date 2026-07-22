'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SourcesPanelProps {
  sources: Array<{ tool: string; durationMs: number }>;
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  if (!sources?.length) return null;

  return (
    <div className="mt-2 p-2 border border-hairline rounded-none bg-canvas-soft">
      <p className="text-[10px] uppercase tracking-wider text-caption mb-1 font-medium">Data Sources</p>
      <div className="flex flex-wrap gap-1">
        {sources.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-canvas border border-hairline text-body rounded-none"
          >
            <ExternalLink size={8} />
            {s.tool}
            <span className="text-caption">({s.durationMs}ms)</span>
          </span>
        ))}
      </div>
    </div>
  );
}
