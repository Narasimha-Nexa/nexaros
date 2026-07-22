'use client';

import React from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';

interface ActionButtonsProps {
  onExport?: (format: string) => void;
  onRefresh?: () => void;
  onGenerateReport?: () => void;
  isStreaming?: boolean;
}

export function ActionButtons({ onExport, onRefresh, onGenerateReport, isStreaming }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isStreaming}
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-body border border-hairline rounded-none hover:bg-canvas-soft transition-colors disabled:opacity-50"
        >
          <RefreshCw size={10} />
          Retry
        </button>
      )}
      {onExport && (
        <>
          <button
            onClick={() => onExport('pdf')}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-body border border-hairline rounded-none hover:bg-canvas-soft transition-colors"
          >
            <Download size={10} />
            PDF
          </button>
          <button
            onClick={() => onExport('csv')}
            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-body border border-hairline rounded-none hover:bg-canvas-soft transition-colors"
          >
            <Download size={10} />
            CSV
          </button>
        </>
      )}
      {onGenerateReport && (
        <button
          onClick={onGenerateReport}
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-primary border border-primary/20 rounded-none hover:bg-primary/5 transition-colors"
        >
          <FileText size={10} />
          Generate Report
        </button>
      )}
    </div>
  );
}
