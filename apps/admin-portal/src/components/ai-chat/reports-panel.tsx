'use client';

import React, { useState } from 'react';
import { FileText, BarChart3, Download, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { ChartData } from '@/stores/ai-chat.store';

const REPORT_TYPES = [
  { key: 'daily', label: 'Daily Summary', description: 'Today\'s revenue, orders, and highlights' },
  { key: 'weekly', label: 'Weekly Report', description: '7-day trends and comparisons' },
  { key: 'monthly', label: 'Monthly Report', description: 'Full month performance review' },
  { key: 'branch', label: 'Branch Report', description: 'Location-wise breakdown' },
  { key: 'menu', label: 'Menu Report', description: 'Item performance and suggestions' },
  { key: 'staff', label: 'Staff Report', description: 'Team performance and scheduling' },
];

interface ReportsPanelProps {
  reports: Array<{ id: string; title?: string; type?: string; content?: string; status: string; createdAt: string }>;
  onGenerate: (type: string) => void;
  generating: boolean;
}

export function ReportsPanel({ reports, onGenerate, generating }: ReportsPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-ink mb-2 flex items-center gap-1.5">
          <FileText size={12} className="text-primary" />
          Generate Report
        </h4>
        <div className="space-y-1.5">
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.key}
              onClick={() => onGenerate(rt.key)}
              disabled={generating}
              className="w-full text-left px-3 py-2 border border-hairline hover:border-primary/30 hover:bg-primary/5 transition-colors group disabled:opacity-50"
            >
              <p className="text-xs font-medium text-ink group-hover:text-primary">{rt.label}</p>
              <p className="text-[10px] text-caption mt-0.5">{rt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {reports.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-ink mb-2 flex items-center gap-1.5">
            <BarChart3 size={12} className="text-accent" />
            Recent Reports
          </h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {reports.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="px-3 py-2 border border-hairline hover:bg-canvas-soft transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-ink capitalize">{r.type || r.title || 'Report'}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 ${
                    r.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                    r.status === 'FAILED' ? 'bg-danger/10 text-danger' :
                    'bg-info/10 text-info'
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-[10px] text-caption mt-0.5">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-ink mb-1.5">Quick Tips</h4>
        <ul className="space-y-1 text-[11px] text-body">
          <li className="flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            Ask follow-up questions for deeper analysis
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            Use "compare" to benchmark against previous periods
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            Charts auto-generate when data supports visualization
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-primary mt-0.5">•</span>
            Export reports as CSV from the chart actions
          </li>
        </ul>
      </div>
    </div>
  );
}
