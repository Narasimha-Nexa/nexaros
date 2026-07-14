# Billing & Subscription

## Overview

NexaROS implements a comprehensive billing system with plan-based entitlements.

## Plans

| Plan | Price | Branches | Staff | Trial |
|------|-------|----------|-------|-------|
| Starter Free | ₹0 | 1 | 5 | 0 days |
| Professional | ₹2,999/mo | 3 | 20 | 14 days |
| Business | ₹7,999/mo | 10 | 100 | 14 days |
| Enterprise | ₹19,999/mo | Unlimited | Unlimited | 30 days |

## Entitlements

### Module Keys (21)

| Key | Description |
|-----|-------------|
| pos | Point of Sale |
| kitchen | Kitchen Display |
| orders | Order Management |
| tables | Table Management |
| inventory | Inventory Tracking |
| staff | Staff Management |
| shifts | Shift Scheduling |
| attendance | Attendance Tracking |
| payments | Payment Processing |
| invoices | GST Invoicing |
| reports | Analytics Reports |
| ai_analytics | AI Insights |
| crm | Customer Relations |
| loyalty | Loyalty Program |
| qr_ordering | QR Code Ordering |
| customer_website | Online Store |
| reservations | Table Booking |
| multi_branch | Multi-Branch |
| api_access | API Access |
| white_label | White Label |
| priority_support | Priority Support |

## Subscription Lifecycle

```
TRIAL → ACTIVE → PAYMENT_PENDING → GRACE_PERIOD → RESTRICTED → SUSPENDED → ARCHIVED
```

### Status Definitions

| Status | Access |
|--------|--------|
| TRIAL | Full |
| ACTIVE | Full |
| PAYMENT_PENDING | Full |
| GRACE_PERIOD | Full |
| RESTRICTED | Core only |
| SUSPENDED | Minimal |
| ARCHIVED | None |

### Restricted Mode

- ✅ POS, Orders, Kitchen, Tables, Payments, Invoices
- ❌ Everything else

## Payment Promise

```typescript
PaymentPromise {
  id: string
  tenantId: string
  subscriptionId: string
  reason: string
  promisedAmount: number
  expectedDate: Date
  status: PENDING | FULFILLED | BROKEN
}
```

## Scheduler

- Runs daily at 2 AM
- Handles 5 transition types
- Processes payment promises

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/entitlements/:tenantId` | Get entitlements |
| POST | `/billing/checkout` | Create checkout |
| POST | `/billing/transition` | Transition subscription |
| POST | `/billing/payment-promise` | Create promise |
| GET | `/billing/invoices/:tenantId` | Subscription invoices |
| GET | `/billing/payments/:tenantId` | Subscription payments |

## Related Documents

- [Subscription Lifecycle](40_SUBSCRIPTION_LIFECYCLE.md)
- [Coupon Engine](25_COUPON_ENGINE.md)
- [Modules](08_MODULES.md)
