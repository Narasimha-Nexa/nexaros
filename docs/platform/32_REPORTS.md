# Reports & Analytics

> Detailed source: [apps/backend/src/modules/reports/](../../apps/backend/src/modules/reports/)

## Overview

NexaROS provides comprehensive reporting for sales, inventory, staff, and financials.

## Report Types

### Sales Reports

| Report | Description | Metrics |
|--------|-------------|---------|
| Daily Sales | Today's sales summary | Total sales, orders, avg order value |
| Sales by Item | Item performance | Items sold, revenue, margin |
| Sales by Category | Category performance | Category revenue, items sold |
| Sales by Time | Hourly/daily trends | Peak hours, busy days |
| Sales by Payment | Payment method analysis | Cash, UPI, card breakdown |

### Inventory Reports

| Report | Description | Metrics |
|--------|-------------|---------|
| Stock Summary | Current stock levels | Items, quantities, value |
| Low Stock | Items below minimum | Item name, current stock, min stock |
| Stock Movement | Stock in/out history | Additions, adjustments, waste |
| Purchase History | Purchase orders | Supplier, amount, date |

### Staff Reports

| Report | Description | Metrics |
|--------|-------------|---------|
| Attendance | Staff attendance | Clock in/out, hours worked |
| Performance | Staff performance | Orders handled, tips received |
| Shift Coverage | Shift analysis | Coverage gaps, overtime |

### Financial Reports

| Report | Description | Metrics |
|--------|-------------|---------|
| Profit & Loss | Revenue vs expenses | Gross profit, net profit |
| Tax Report | Tax collection | GST, service tax |
| Refund Report | Refund analysis | Refund amount, reasons |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/daily-sales` | Daily sales report |
| GET | `/reports/items` | Item performance |
| GET | `/reports/categories` | Category performance |
| GET | `/reports/inventory` | Inventory summary |
| GET | `/reports/low-stock` | Low stock alerts |
| GET | `/reports/staff-attendance` | Staff attendance |
| GET | `/reports/profit-loss` | Profit & loss |
| GET | `/reports/tax` | Tax collection |
| GET | `/reports/export/:type` | Export report (PDF/CSV) |

## Report Data Structure

```typescript
interface DailySalesReport {
  date: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentBreakdown: {
    cash: number;
    upi: number;
    card: number;
    wallet: number;
    online: number;
  };
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  hourlyTrend: {
    hour: number;
    orders: number;
    sales: number;
  }[];
}
```

## Report Generation

### Real-Time Reports

```typescript
// Daily sales - calculated on demand
async getDailySales(tenantId: string, branchId: string, date: Date) {
  const orders = await this.prisma.order.findMany({
    where: {
      tenantId,
      branchId,
      createdAt: { gte: startOfDay(date), lte: endOfDay(date) },
      status: 'COMPLETED'
    }
  });
  
  return this.calculateSalesMetrics(orders);
}
```

### Cached Reports

```typescript
// Monthly reports - cached for performance
async getMonthlySales(tenantId: string, month: string) {
  const cacheKey = `report:monthly:${tenantId}:${month}`;
  const cached = await this.cache.get(cacheKey);
  
  if (cached) return cached;
  
  const report = await this.calculateMonthlySales(tenantId, month);
  await this.cache.set(cacheKey, report, 3600); // 1 hour
  
  return report;
}
```

## Report Export

### PDF Export

```typescript
async exportPDF(reportType: string, params: ReportParams) {
  const data = await this.getReport(reportType, params);
  const pdf = await this.pdfService.generate(reportType, data);
  return pdf;
}
```

### CSV Export

```typescript
async exportCSV(reportType: string, params: ReportParams) {
  const data = await this.getReport(reportType, params);
  const csv = this.csvService.generate(data);
  return csv;
}
```

## Flutter Report UI

### Sales Dashboard

```dart
class SalesDashboard extends StatelessWidget {
  // Today's sales summary
  // Payment breakdown pie chart
  // Hourly trend line chart
  // Top items bar chart
}
```

### Report List

```dart
class ReportList extends StatelessWidget {
  // Available reports
  // Filter by date range
  // Export options
}
```

## Related Documents

- [Modules](08_MODULES.md)
- [API Documentation](21_API_DOCUMENTATION.md)
- [Flutter App](32_FLUTTER_APP.md)
