# Reporting System

## Report Types

### Sales Reports

| Report | Frequency | Metrics |
|--------|-----------|---------|
| Daily Sales | Daily | Total sales, orders, AOV |
| Weekly Summary | Weekly | Week-over-week trends |
| Monthly Report | Monthly | Month-over-month trends |
| Item Performance | Daily | Items sold, revenue, margin |
| Category Performance | Daily | Category revenue, items sold |
| Payment Breakdown | Daily | Cash, UPI, card, wallet |

### Inventory Reports

| Report | Frequency | Metrics |
|--------|-----------|---------|
| Stock Summary | Real-time | Current stock levels |
| Low Stock Alert | Real-time | Items below minimum |
| Stock Movement | Daily | In/out history |
| Purchase History | Weekly | Purchase orders |
| Waste Report | Weekly | Expired/damaged items |

### Staff Reports

| Report | Frequency | Metrics |
|--------|-----------|---------|
| Attendance | Daily | Clock in/out, hours |
| Performance | Weekly | Orders handled, tips |
| Shift Coverage | Weekly | Coverage gaps, overtime |
| Cost Analysis | Monthly | Labor cost, efficiency |

### Financial Reports

| Report | Frequency | Metrics |
|--------|-----------|---------|
| Profit & Loss | Monthly | Revenue vs expenses |
| Tax Report | Monthly | GST collection |
| Refund Report | Weekly | Refund amount, reasons |
| Subscription | Monthly | Plan revenue, churn |

## Export Formats

| Format | Usage |
|--------|-------|
| PDF | Official reports |
| CSV | Data analysis |
| Excel | Advanced analysis |
| JSON | API integration |

## Implementation

### Backend

```typescript
@Injectable()
export class ReportsService {
  async getDailySales(tenantId: string, date: Date) {
    // Generate daily sales report
  }
  
  async exportPDF(reportType: string, params: ReportParams) {
    // Generate PDF
  }
  
  async exportCSV(reportType: string, params: ReportParams) {
    // Generate CSV
  }
}
```

### Flutter

```dart
class ReportsScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ReportCard(title: 'Daily Sales', onTap: () => viewReport('daily-sales')),
        ReportCard(title: 'Item Performance', onTap: () => viewReport('items')),
        ReportCard(title: 'Inventory', onTap: () => viewReport('inventory')),
        ReportCard(title: 'Staff Attendance', onTap: () => viewReport('attendance')),
      ],
    );
  }
}
```

## Related Documents

- [Modules](08_MODULES.md)
- [API Documentation](21_API_DOCUMENTATION.md)
