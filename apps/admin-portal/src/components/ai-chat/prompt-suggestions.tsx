'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface PromptSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function PromptSuggestions({ suggestions, onSelect }: PromptSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {suggestions.map((s, i) => (
        <button
          key={i}
          onClick={() => onSelect(s)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-body border border-hairline rounded-none hover:border-primary/30 hover:text-ink transition-colors"
        >
          <Sparkles size={12} className="text-primary/60" />
          {s}
        </button>
      ))}
    </div>
  );
}
