# NexaROS Database Reference

## Overview

- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.19.x
- **Port**: 5433 (dev), 5432 (Docker)
- **Schema**: 48+ models across 10+ domains

## Entity Relationships

```
Tenant ──┬── Branch ──── Staff ──── StaffShift ──── Shift
         │              │
         │              └── Attendance
         │
         ├── User ──── Role ──── RolePermission ──── Permission
         │
         ├── Subscription ──── Plan ──── PlanEntitlement
         │              │
         │              ├── SubscriptionPayment
         │              └── SubscriptionInvoice
         │
         ├── Coupon ──── CouponUsage
         ├── PaymentPromise
         ├── FeatureFlag ──── TenantFeatureFlag
         ├── DemoRequest
         ├── SupportTicket ──── TicketMessage
         └── PlatformSettings
```

## Core Models

### Tenant
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Restaurant name |
| slug | String (unique) | URL slug |
| email | String | Contact email |
| phone | String? | Contact phone |
| businessType | String? | Restaurant type |
| country | String? | Default: "India" |
| state | String? | Indian state |
| city | String? | City |
| isActive | Boolean | Active status |
| createdAt | DateTime | Creation date |

### Branch
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| tenantId | String | FK to Tenant |
| name | String | Branch name |
| address | String? | Branch address |
| phone | String? | Branch phone |
| isActive | Boolean | Active status |

### Subscription
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| tenantId | String | FK to Tenant |
| planId | String | FK to PlatformPlan |
| status | SubscriptionStatus | TRIAL/ACTIVE/PAYMENT_PENDING/GRACE_PERIOD/RESTRICTED/SUSPENDED/ARCHIVED |
| entitlements | Json | Module access overrides |
| customPrice | Decimal? | Custom price override |
| discount | Decimal? | Discount amount |
| trialStartedAt | DateTime? | Trial start |
| trialEndsAt | DateTime? | Trial end |
| currentPeriodStart | DateTime? | Billing period start |
| currentPeriodEnd | DateTime? | Billing period end |
| gracePeriodDays | Int | Default: 7 |
| graceStartedAt | DateTime? | Grace period start |
| hasPromise | Boolean | Payment promise active |
| promiseUntil | DateTime? | Promise deadline |
| promiseReason | String? | Promise reason |

### PlatformPlan
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Plan name |
| slug | String (unique) | URL slug |
| description | String? | Plan description |
| price | Decimal | Monthly price |
| billingCycle | BillingCycle | MONTHLY/YEARLY |
| trialDays | Int | Trial duration |
| maxBranches | Int | Max branches |
| maxStaff | Int | Max staff |
| isCustom | Boolean | Custom plan flag |

### PlanEntitlement
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| planId | String | FK to PlatformPlan |
| moduleKey | String | Module identifier |
| enabled | Boolean | Access flag |

## Module Keys (21)

`pos`, `kitchen`, `orders`, `tables`, `inventory`, `staff`, `shifts`, `attendance`, `payments`, `invoices`, `reports`, `ai_analytics`, `crm`, `loyalty`, `qr_ordering`, `customer_website`, `reservations`, `multi_branch`, `api_access`, `white_label`, `priority_support`

## Restricted Mode Allowed Modules

`pos`, `orders`, `kitchen`, `tables`, `payments`, `invoices`

## Order Status Flow

```
PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED
    └──────────────────────────────────────→ CANCELLED
```

## Table Status Flow

```
FREE → OCCUPIED → ORDER_READY → BILLING → FREE
  └──→ CLEANING → FREE
  └──→ RESERVED → OCCUPIED
```

## Key Indexes

- `Tenant`: slug (unique)
- `Branch`: tenantId
- `Subscription`: [tenantId, status], [status, nextBillingDate]
- `Order`: [tenantId, branchId, status], [branchId, createdAt]
- `MenuItem`: [tenantId, branchId, categoryId]
- `Payment`: orderId (unique)
- `AdminUser`: email (unique)
- `AdminSession`: [adminUserId, expiresAt]
- `Coupon`: code (unique)
- `SupportTicket`: [tenantId, status]

## Seed Data

### Platform Plans
| Plan | Price | Branches | Staff | Trial |
|------|-------|----------|-------|-------|
| Starter Free | ₹0 | 1 | 5 | 0 |
| Professional | ₹2,999/mo | 3 | 20 | 14 days |
| Business | ₹7,999/mo | 10 | 100 | 14 days |
| Enterprise | ₹19,999/mo | Unlimited | Unlimited | 30 days |

### Default Admin
- Email: `admin@nexaros.com`
- Password: `admin123`
