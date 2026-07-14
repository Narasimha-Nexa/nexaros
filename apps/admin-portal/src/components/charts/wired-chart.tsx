'use client';
import React from 'react';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export const WIRED_CHART_COLORS = {
  ink: '#000000',
  inkSoft: '#1a1a1a',
  canvas: '#ffffff',
  canvasSoft: '#f7f7f8',
  hairline: '#e5e5e5',
  body: '#737373',
  link: '#057dbc',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
} as const;

export const WIRED_PALETTE = [
  WIRED_CHART_COLORS.ink,
  WIRED_CHART_COLORS.body,
  WIRED_CHART_COLORS.link,
  WIRED_CHART_COLORS.success,
  WIRED_CHART_COLORS.warning,
  WIRED_CHART_COLORS.danger,
];

export const WIRED_DONUT_PALETTE = [
  WIRED_CHART_COLORS.ink,
  WIRED_CHART_COLORS.link,
  WIRED_CHART_COLORS.success,
  WIRED_CHART_COLORS.warning,
  WIRED_CHART_COLORS.danger,
  WIRED_CHART_COLORS.body,
];

export const wiredBaseOptions: Partial<ApexCharts.ApexOptions> = {
  chart: {
    fontFamily: "'Inter', system-ui, sans-serif",
    toolbar: { show: false },
    sparkline: { enabled: false },
    animations: {
      enabled: true,
      speed: 600,
    },
    background: 'transparent',
  },
  grid: {
    borderColor: WIRED_CHART_COLORS.hairline,
    strokeDashArray: 0,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
    padding: { top: -10, bottom: -10 },
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: 'smooth',
    width: 2,
    lineCap: 'round',
  },
  xaxis: {
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '11px',
        fontWeight: 500,
        colors: WIRED_CHART_COLORS.body,
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '11px',
        fontWeight: 500,
        colors: WIRED_CHART_COLORS.body,
      },
    },
  },
  tooltip: {
    theme: 'light',
    style: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: '12px',
    },
    x: { show: false },
  },
  legend: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    itemMargin: { horizontal: 12 },
    markers: {
      strokeWidth: 0,
      size: 10,
    },
  },
  states: {
    hover: { filter: { type: 'none' } },
    active: { filter: { type: 'none' } },
  },
};

export function wiredYAxis(labels?: { formatter?: (val: number) => string }): any {
  return {
    labels: {
      style: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '11px',
        fontWeight: 500,
        colors: WIRED_CHART_COLORS.body,
      },
      ...labels,
    },
  };
}

interface WiredChartProps {
  options: ApexCharts.ApexOptions;
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  type: 'line' | 'area' | 'bar' | 'donut' | 'radialBar' | 'scatter' | 'heatmap' | 'pie';
  height?: number | string;
  width?: number | string;
}

export function WiredChart({ options, series, type, height = 300, width = '100%' }: WiredChartProps) {
  return (
    <div className="w-full">
      <Chart
        options={options}
        series={series}
        type={type}
        height={height}
        width={width}
      />
    </div>
  );
}
