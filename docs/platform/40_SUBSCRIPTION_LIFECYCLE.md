# Subscription Lifecycle

> Detailed source: [apps/backend/src/modules/billing/](../../apps/backend/src/modules/billing/)

## Overview

NexaROS implements a comprehensive subscription lifecycle with grace periods and restricted modes.

## Subscription Statuses

```
TRIAL → ACTIVE → PAYMENT_PENDING → GRACE_PERIOD → RESTRICTED → SUSPENDED → ARCHIVED
         ↑                          ↑                           ↑
         └──────────────────────────┴───────────────────────────┘
                        (Reactivate at any point)
```

### Status Definitions

| Status | Description | Access Level |
|--------|-------------|--------------|
| TRIAL | 14-day trial period | Full access |
| ACTIVE | Paid subscription active | Full access |
| PAYMENT_PENDING | Payment due | Full access |
| GRACE_PERIOD | 7 days after payment due | Full access |
| RESTRICTED | Grace period expired | Core features only |
| SUSPENDED | 30 days restricted | Minimal access |
| ARCHIVED | 90 days suspended | No access |

## Restricted Mode Features

When subscription is RESTRICTED, users can still access:

- ✅ POS (point of sale)
- ✅ Orders
- ✅ Kitchen Display
- ✅ Tables
- ✅ Payments
- ✅ Invoices

Everything else requires active subscription:

- ❌ Reports
- ❌ Inventory
- ❌ Staff Management
- ❌ Reservations
- ❌ CRM
- ❌ Loyalty Program
- ❌ AI Analytics
- ❌ API Access
- ❌ White Label
- ❌ Priority Support

## Subscription Lifecycle

### Trial Period

```
1. Restaurant registers
2. System creates 14-day trial subscription
3. Full access to all features
4. Daily email reminders (planned)
5. On expiry → PAYMENT_PENDING
```

### Active Subscription

```
1. User subscribes to plan
2. Payment processed (Stripe/Razorpay)
3. Subscription status → ACTIVE
4. Entitlements updated from plan
5. Full access continues
```

### Payment Pending

```
1. Monthly/annual payment due
2. Payment fails or not processed
3. Status → PAYMENT_PENDING
4. User notified (email, in-app)
5. 7-day grace period begins
```

### Grace Period

```
1. Payment still pending
2. Status → GRACE_PERIOD
3. Full access continues
4. Daily reminders sent
5. After 7 days → RESTRICTED
```

### Restricted Mode

```
1. Grace period expired
2. Status → RESTRICTED
3. Core features only (POS, Orders, Kitchen, Tables, Payments, Invoices)
4. User can still process orders and accept payments
5. After 30 days → SUSPENDED
```

### Suspended

```
1. Restricted for 30 days
2. Status → SUSPENDED
3. Minimal access (view only)
4. Data preserved
5. After 90 days → ARCHIVED
```

### Archived

```
1. Suspended for 90 days
2. Status → ARCHIVED
3. Account frozen
3. Data preserved for 1 year
4. Can be restored on request
```

## Payment Promise System

For deferred payments:

```typescript
PaymentPromise {
  id: string
  tenantId: string
  subscriptionId: string
  reason: string
  promisedAmount: number
  expectedDate: Date
  status: PENDING | FULFILLED | BROKEN
  notes: string
}
```

### Payment Promise Flow

```
1. User contacts support for extension
2. Admin creates payment promise
3. Subscription remains active
4. On expected date:
   - If fulfilled → Continue active
   - If broken → RESTRICTED
```

## Subscription Scheduler

Runs daily at 2 AM:

```typescript
@Cron('0 2 * * *')
async handleSubscriptionTransitions() {
  // 1. Trials expiring tomorrow → PAYMENT_PENDING
  // 2. Payment pending > 7 days → GRACE_PERIOD
  // 3. Grace period > 7 days → RESTRICTED
  // 4. Restricted > 30 days → SUSPENDED
  // 5. Suspended > 90 days → ARCHIVED
  // 6. Payment promises expired → BROKEN
}
```

## Entitlements

Each subscription stores a snapshot of entitlements:

```json
{
  "features": {
    "pos": true,
    "kitchen": true,
    "orders": true,
    "tables": true,
    "payments": true,
    "invoices": true,
    "reports": true,
    "inventory": true,
    "staff": true,
    "shifts": true,
    "attendance": true,
    "reservations": true,
    "crm": true,
    "loyalty": true,
    "ai_analytics": true,
    "qr_ordering": true,
    "customer_website": true,
    "api_access": false,
    "white_label": false,
    "priority_support": false,
    "multi_branch": true
  },
  "limits": {
    "maxBranches": 3,
    "maxStaff": 20,
    "maxMenuItems": 500,
    "maxOrdersPerDay": 1000
  }
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/entitlements/:tenantId` | Get tenant entitlements |
| POST | `/billing/checkout` | Create checkout session |
| POST | `/billing/transition` | Transition subscription (admin) |
| POST | `/billing/payment-promise` | Create payment promise |
| GET | `/billing/invoices/:tenantId` | Subscription invoices |
| GET | `/billing/payments/:tenantId` | Subscription payments |

## Related Documents

- [Billing & Subscription](24_BILLING_SUBSCRIPTION.md)
- [Coupon Engine](25_COUPON_ENGINE.md)
- [Modules](08_MODULES.md)
