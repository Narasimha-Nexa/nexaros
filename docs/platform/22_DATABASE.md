# Database

## Overview

- **Database**: PostgreSQL 16
- **ORM**: Prisma 6.19.x
- **Schema**: 49 models, 1,111 lines
- **Port**: 5433 (dev), 5432 (Docker)

## Model Inventory (49 Models)

### Core

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Tenant | Restaurant organization | name, slug, email, businessType, country, state, city |
| Branch | Physical location | tenantId, name, address, isPrimary, isActive |
| User | Restaurant user | tenantId, email, password, firstName, role |
| RefreshToken | JWT refresh tokens | token, userId, expiresAt |
| Role | RBAC role | tenantId, name, isSystem |
| Permission | System permission | module, action |
| RolePermission | Role-permission mapping | roleId, permissionId |

### Operations

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Category | Menu category | tenantId, name, sortOrder |
| MenuItem | Menu item | tenantId, branchId, categoryId, name, price, isAvailable |
| MenuItemImage | Item images | menuItemId, url, sortOrder |
| MenuItemVariant | Item variants | menuItemId, name, priceModifier |
| MenuItemAddOn | Item add-ons | menuItemId, name, price |
| RestaurantTable | Table | tenantId, branchId, number, status, capacity |
| Order | Customer order | tenantId, branchId, tableId, status, total |
| OrderItem | Order line item | orderId, menuItemId, quantity, price |
| OrderItemAddOn | Item add-ons | orderItemId, name, price |
| OrderStatusHistory | Status audit | orderId, status, notes |
| Payment | Payment record | orderId, method, amount, status |
| Invoice | GST invoice | paymentId, invoiceNumber, total, gstAmount |

### Back Office

| Model | Purpose | Key Fields |
|-------|---------|------------|
| InventoryItem | Stock item | tenantId, branchId, name, quantity, unit, minStock |
| StockMovement | Stock audit | inventoryItemId, type, quantity, reference |
| Supplier | Supplier | tenantId, name, phone, email |
| Purchase | Purchase order | tenantId, supplierId, status, total |
| PurchaseItem | Purchase line | purchaseId, name, quantity, unitPrice |

### Staff

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Staff | Employee | tenantId, branchId, name, phone, pin, isActive |
| Shift | Shift template | tenantId, branchId, name, startTime, endTime |
| StaffShift | Shift assignment | staffId, shiftId, date, status |
| Attendance | Clock in/out | staffId, date, checkIn, checkOut, status |

### Reservations

| Model | Purpose | Key Fields |
|-------|---------|------------|
| Reservation | Table booking | tenantId, branchId, tableId, guestName, date, time, status |

### Platform

| Model | Purpose | Key Fields |
|-------|---------|------------|
| PlatformPlan | Subscription plan | name, slug, price, trialDays, maxBranches, maxStaff |
| PlanEntitlement | Plan features | planId, moduleKey, enabled |
| Subscription | Tenant subscription | tenantId, planId, status, entitlements, gracePeriodDays |
| FeatureFlag | Platform feature flag | key, name, enabled |
| TenantFeatureFlag | Tenant flag override | tenantId, featureFlagId, enabled |
| Coupon | Discount coupon | code, type, value, maxDiscount, expiry |
| CouponUsage | Coupon tracking | couponId, tenantId, amount |
| PaymentPromise | Deferred payment | tenantId, subscriptionId, reason, expectedDate |
| SubscriptionPayment | Subscription payment | subscriptionId, amount, status |
| SubscriptionInvoice | Subscription invoice | subscriptionId, invoiceNumber, total |

### Admin

| Model | Purpose | Key Fields |
|-------|---------|------------|
| AdminUser | Super admin user | email, password, name, role, mfaEnabled, mfaSecret |
| AdminSession | Admin session | adminUserId, token, ipAddress, userAgent |
| AdminAuditLog | Admin audit | adminUserId, action, entity, entityId, oldData, newData |

### Platform

| Model | Purpose | Key Fields |
|-------|---------|------------|
| DemoRequest | Demo pipeline | restaurantName, contactName, email, status |
| SupportTicket | Support ticket | tenantId, subject, status, priority |
| TicketMessage | Ticket message | ticketId, senderType, message, isInternal |
| PlatformSettings | Config settings | key, value, description |

### Other

| Model | Purpose |
|-------|---------|
| AuditLog | General audit trail |
| RecipeItem | Menu item recipes |
| RecipeIngredient | Recipe ingredients |

## Entity Relationships

```
Tenant ──┬── Branch ──── Staff ──── StaffShift ──── Shift
         │              │
         │              └── Attendance
         │
         ├── User ──── Role ──── RolePermission ──── Permission
         │
         ├── Subscription ──── PlatformPlan ──── PlanEntitlement
         │              │
         │              ├── SubscriptionPayment
         │              └── SubscriptionInvoice
         │
         ├── Category ──── MenuItem ──── MenuItemImage
         │              │              ├── MenuItemVariant
         │              │              └── MenuItemAddOn
         │              │
         │              └── Order ──── OrderItem ──── OrderItemAddOn
         │                         │
         │                         ├── Payment ──── Invoice
         │                         └── OrderStatusHistory
         │
         ├── RestaurantTable ──── Order
         │                    └── Reservation
         │
         ├── InventoryItem ──── StockMovement
         ├── Supplier ──── Purchase ──── PurchaseItem
         │
         ├── Coupon ──── CouponUsage
         ├── PaymentPromise
         ├── FeatureFlag ──── TenantFeatureFlag
         ├── SupportTicket ──── TicketMessage
         └── DemoRequest
```

## Enums

| Enum | Values |
|------|--------|
| SubscriptionStatus | TRIAL, ACTIVE, PAYMENT_PENDING, GRACE_PERIOD, RESTRICTED, SUSPENDED, ARCHIVED |
| BillingCycle | MONTHLY, YEARLY |
| OrderStatus | PENDING, CONFIRMED, PREPARING, READY, SERVED, COMPLETED, CANCELLED |
| TableStatus | FREE, OCCUPIED, ORDER_READY, BILLING, CLEANING, RESERVED |
| PaymentMethod | CASH, UPI, CARD, NET_BANKING, WALLET, ONLINE |
| PaymentStatus | PENDING, COMPLETED, FAILED, REFUNDED |
| TicketStatus | OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED |
| TicketPriority | LOW, NORMAL, HIGH, URGENT |
| DemoRequestStatus | NEW, CONTACTED, SCHEDULED, CONVERTED, LOST |

## Seed Data

### Platform Plans

| Plan | Price | Branches | Staff | Trial |
|------|-------|----------|-------|-------|
| Starter Free | ₹0 | 1 | 5 | 0 days |
| Professional | ₹2,999/mo | 3 | 20 | 14 days |
| Business | ₹7,999/mo | 10 | 100 | 14 days |
| Enterprise | ₹19,999/mo | Unlimited | Unlimited | 30 days |

### Default Admin
- Email: `admin@nexaros.com`
- Password: `admin123`

## Related Documents

- [Database Audit](../../audits/database-audit.md)
- [Modules](08_MODULES.md)
- [API Documentation](21_API_DOCUMENTATION.md)
