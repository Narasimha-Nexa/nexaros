'use client';

import React from 'react';
import type { ChartData } from '@/stores/ai-chat.store';

interface ChartRendererProps {
  chart: ChartData;
}

const COLORS = ['#E23744', '#16A34A', '#D97706', '#7C3AED', '#0891B2', '#DC2626'];

export function ChartRenderer({ chart }: ChartRendererProps) {
  if (!chart || !chart.labels?.length || !chart.series?.length) return null;

  if (chart.type === 'donut' || chart.type === 'pie') {
    return <DonutChart chart={chart} />;
  }

  if (chart.type === 'bar') {
    return <BarChart chart={chart} />;
  }

  return <LineChart chart={chart} />;
}

function LineChart({ chart }: { chart: ChartData }) {
  const maxVal = Math.max(...chart.series.flatMap((s) => s.data));
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  return (
    <div className="border border-hairline rounded-none p-3 bg-canvas">
      <p className="text-xs font-medium text-ink mb-2">{chart.title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {chart.series.map((series, si) => {
          const points = series.data.map((val, i) => {
            const x = padding.left + (i / (series.data.length - 1 || 1)) * chartWidth;
            const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
            return `${x},${y}`;
          });
          return (
            <polyline
              key={si}
              points={points.join(' ')}
              fill="none"
              stroke={COLORS[si % COLORS.length]}
              strokeWidth="2"
            />
          );
        })}
        {chart.labels.map((label, i) => {
          const x = padding.left + (i / (chart.labels.length - 1 || 1)) * chartWidth;
          return (
            <text key={i} x={x} y={height - 10} textAnchor="middle" className="text-[8px] fill-body">
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex gap-3 mt-1">
        {chart.series.map((s, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] text-body">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ chart }: { chart: ChartData }) {
  const maxVal = Math.max(...chart.series.flatMap((s) => s.data));
  const barGroupWidth = 100 / chart.labels.length;
  const barWidth = barGroupWidth / (chart.series.length + 1);

  return (
    <div className="border border-hairline rounded-none p-3 bg-canvas">
      <p className="text-xs font-medium text-ink mb-2">{chart.title}</p>
      <div className="flex items-end gap-1 h-32">
        {chart.labels.map((label, li) => (
          <div key={li} className="flex-1 flex items-end gap-px">
            {chart.series.map((series, si) => {
              const height = maxVal > 0 ? (series.data[li] / maxVal) * 100 : 0;
              return (
                <div
                  key={si}
                  className="flex-1 rounded-none"
                  style={{ height: `${height}%`, backgroundColor: COLORS[si % COLORS.length] }}
                  title={`${series.name}: ${series.data[li]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {chart.labels.map((label, i) => (
          <span key={i} className="flex-1 text-center text-[7px] text-body truncate">{label}</span>
        ))}
      </div>
      <div className="flex gap-3 mt-1">
        {chart.series.map((s, i) => (
          <span key={i} className="flex items-center gap-1 text-[10px] text-body">
            <span className="w-2 h-2 rounded-none" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ chart }: { chart: ChartData }) {
  const total = chart.series[0]?.data.reduce((a, b) => a + b, 0) || 1;
  let cumulative = 0;
  const size = 120;
  const radius = 40;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="border border-hairline rounded-none p-3 bg-canvas">
      <p className="text-xs font-medium text-ink mb-2">{chart.title}</p>
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {chart.labels.map((label, i) => {
            const value = chart.series[0]?.data[i] || 0;
            const pct = value / total;
            const startAngle = (cumulative / total) * 2 * Math.PI;
            cumulative += value;
            const endAngle = (cumulative / total) * 2 * Math.PI;
            const largeArc = pct > 0.5 ? 1 : 0;
            const x1 = cx + radius * Math.cos(startAngle - Math.PI / 2);
            const y1 = cy + radius * Math.sin(startAngle - Math.PI / 2);
            const x2 = cx + radius * Math.cos(endAngle - Math.PI / 2);
            const y2 = cy + radius * Math.sin(endAngle - Math.PI / 2);
            return (
              <path
                key={i}
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={COLORS[i % COLORS.length]}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={20} fill="white" />
          <text x={cx} y={cy + 4} textAnchor="middle" className="text-[10px] font-semibold fill-ink">
            {total.toLocaleString()}
          </text>
        </svg>
        <div className="flex flex-col gap-1.5">
          {chart.labels.map((label, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className="w-2 h-2 rounded-none shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-body">{label}</span>
              <span className="text-ink font-medium">{chart.series[0]?.data[i]?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
