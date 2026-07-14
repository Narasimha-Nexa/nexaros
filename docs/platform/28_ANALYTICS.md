# Analytics

## Overview

NexaROS provides analytics for restaurants and the platform.

## Restaurant Analytics

### Sales Analytics

- Total sales (daily, weekly, monthly)
- Average order value
- Peak hours
- Revenue by category
- Revenue by payment method

### Item Analytics

- Top selling items
- Item revenue
- Item margins
- Category performance

### Customer Analytics

- Order frequency
- Average spend
- Repeat rate
- Customer lifetime value

### Operational Analytics

- Order preparation time
- Table turnover rate
- Staff efficiency
- Inventory turnover

## Platform Analytics

### Tenant Metrics

- Total tenants
- Active tenants
- New registrations
- Churn rate

### Revenue Metrics

- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)

### Usage Metrics

- Daily active users
- Feature usage
- API calls
- Storage usage

## Implementation

### Backend

```typescript
@Injectable()
export class AnalyticsService {
  async getSalesAnalytics(tenantId: string, dateRange: DateRange) {
    // Calculate sales metrics
  }
  
  async getItemAnalytics(tenantId: string, dateRange: DateRange) {
    // Calculate item metrics
  }
  
  async getPlatformAnalytics() {
    // Calculate platform metrics
  }
}
```

### Flutter

```dart
class AnalyticsDashboard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SalesChart(),
        TopItemsList(),
        PaymentBreakdown(),
        HourlyTrend(),
      ],
    );
  }
}
```

## Related Documents

- [Reports](32_REPORTS.md)
- [Modules](08_MODULES.md)
