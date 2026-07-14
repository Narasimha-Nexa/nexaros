# Database Schema

## Overview

NexaROS uses PostgreSQL with Prisma ORM. 49 models, 1,111 lines.

## Core Models

### Tenant

```typescript
Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  businessType: string
  address: string
  city: string
  state: string
  country: string
  logo: string
  subscriptionId: string
  createdAt: Date
  updatedAt: Date
}
```

### Branch

```typescript
Branch {
  id: string
  tenantId: string
  name: string
  address: string
  city: string
  state: string
  phone: string
  email: string
  isPrimary: boolean
  isActive: boolean
  operatingHours: Json
  createdAt: Date
  updatedAt: Date
}
```

### User

```typescript
User {
  id: string
  tenantId: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  role: string
  createdAt: Date
  updatedAt: Date
}
```

## Operations Models

### MenuItem

```typescript
MenuItem {
  id: string
  tenantId: string
  branchId: string
  categoryId: string
  name: string
  description: string
  price: number
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Order

```typescript
Order {
  id: string
  tenantId: string
  branchId: string
  tableId: string
  status: OrderStatus
  total: number
  notes: string
  createdAt: Date
  updatedAt: Date
}
```

### Payment

```typescript
Payment {
  id: string
  orderId: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  reference: string
  processedAt: Date
}
```

## Platform Models

### PlatformPlan

```typescript
PlatformPlan {
  id: string
  name: string
  slug: string
  price: number
  trialDays: number
  maxBranches: number
  maxStaff: number
  isActive: boolean
}
```

### Subscription

```typescript
Subscription {
  id: string
  tenantId: string
  planId: string
  status: SubscriptionStatus
  entitlements: Json
  gracePeriodDays: number
  trialEndsAt: Date
  currentPeriodStart: Date
  currentPeriodEnd: Date
}
```

## Enums

### SubscriptionStatus

```typescript
enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAYMENT_PENDING
  GRACE_PERIOD
  RESTRICTED
  SUSPENDED
  ARCHIVED
}
```

### OrderStatus

```typescript
enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  READY
  SERVED
  COMPLETED
  CANCELLED
}
```

### PaymentMethod

```typescript
enum PaymentMethod {
  CASH
  UPI
  CARD
  NET_BANKING
  WALLET
  ONLINE
}
```

## Relationships

```
Tenant ──┬── Branch ──── Staff
         │              │
         │              └── Attendance
         │
         ├── User ──── Role ──── Permission
         │
         ├── Subscription ──── PlatformPlan
         │              │
         │              └── PlanEntitlement
         │
         ├── Category ──── MenuItem ──── Order ──── Payment ──── Invoice
         │
         ├── RestaurantTable ──── Order
         │
         ├── InventoryItem ──── StockMovement
         │
         └── SupportTicket ──── TicketMessage
```

## Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migration
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## Seeding

```bash
# Seed database
npx prisma db seed
```

## Related Documents

- [Modules](08_MODULES.md)
- [API Documentation](21_API_DOCUMENTATION.md)
