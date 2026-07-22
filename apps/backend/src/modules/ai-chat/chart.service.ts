import { Injectable, Logger } from '@nestjs/common';

export interface ChartConfig {
  type: 'line' | 'bar' | 'donut' | 'area' | 'pie' | 'scatter';
  title: string;
  labels: string[];
  series: Array<{ name: string; data: number[] }>;
  xAxis?: string;
  yAxis?: string;
  colors?: string[];
}

@Injectable()
export class ChartService {
  private readonly logger = new Logger(ChartService.name);

  generateRevenueChart(data: { date: string; revenue: number }[]): ChartConfig {
    return {
      type: 'line',
      title: 'Revenue Trend',
      labels: data.map(d => d.date),
      series: [{ name: 'Revenue', data: data.map(d => d.revenue) }],
      xAxis: 'Date',
      yAxis: 'Revenue (₹)',
      colors: ['#2563eb'],
    };
  }

  generateOrdersChart(data: { date: string; count: number }[]): ChartConfig {
    return {
      type: 'bar',
      title: 'Orders Trend',
      labels: data.map(d => d.date),
      series: [{ name: 'Orders', data: data.map(d => d.count) }],
      xAxis: 'Date',
      yAxis: 'Orders',
      colors: ['#16a34a'],
    };
  }

  generateBranchComparisonChart(data: { branch: string; revenue: number; orders: number }[]): ChartConfig {
    return {
      type: 'bar',
      title: 'Branch Performance',
      labels: data.map(d => d.branch),
      series: [
        { name: 'Revenue', data: data.map(d => d.revenue) },
        { name: 'Orders', data: data.map(d => d.orders) },
      ],
      xAxis: 'Branch',
      yAxis: 'Value',
      colors: ['#2563eb', '#16a34a'],
    };
  }

  generateDonutChart(labels: string[], values: number[], title: string): ChartConfig {
    return {
      type: 'donut',
      title,
      labels,
      series: [{ name: title, data: values }],
      colors: ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'],
    };
  }

  generateAreaChart(data: { date: string; value: number }[], seriesName: string): ChartConfig {
    return {
      type: 'area',
      title: `${seriesName} Trend`,
      labels: data.map(d => d.date),
      series: [{ name: seriesName, data: data.map(d => d.value) }],
      xAxis: 'Date',
      yAxis: seriesName,
      colors: ['#2563eb'],
    };
  }

  extractChartFromResponse(content: string): ChartConfig | null {
    try {
      const chartMatch = content.match(/\{"chart":\{[\s\S]*?\}\}/);
      if (chartMatch) {
        const parsed = JSON.parse(chartMatch[0]);
        if (parsed.chart && parsed.chart.type && parsed.chart.labels && parsed.chart.series) {
          return parsed.chart as ChartConfig;
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }

  autoGenerateChart(toolName: string, data: Record<string, unknown>): ChartConfig | null {
    try {
      switch (toolName) {
        case 'RevenueAnalyticsTool':
          return this.generateDonutChart(
            ['Revenue', 'Discounts', 'Refunds'],
            [Number(data.netRevenue) || 0, Number(data.discounts) || 0, Number(data.refunds) || 0],
            'Revenue Breakdown',
          );
        case 'OrdersAnalyticsTool':
          return this.generateDonutChart(
            ['Dine-In', 'Takeaway', 'Delivery'],
            [Number(data.dineIn) || 0, Number(data.takeaway) || 0, Number(data.delivery) || 0],
            'Orders by Type',
          );
        case 'BranchComparisonTool':
          if (Array.isArray(data.branches)) {
            return this.generateBranchComparisonChart(
              data.branches.map((b: Record<string, unknown>) => ({
                branch: String(b.name || b.branchId || 'Unknown'),
                revenue: Number(b.revenue) || 0,
                orders: Number(b.orders) || 0,
              })),
            );
          }
          break;
        default:
          break;
      }
    } catch {
      // ignore
    }
    return null;
  }
}
