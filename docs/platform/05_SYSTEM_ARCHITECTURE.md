# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Marketing   │  Customer    │  Flutter App │  Super Admin       │
│  (Next.js)   │  (Next.js)   │  (Dart)      │  (Next.js)         │
│  :3002       │  :3001       │  Mobile/Tab  │  :3003             │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────────┘
       │              │              │                │
       └──────────────┴──────┬───────┴────────────────┘
                             │
                    ┌────────▼────────┐
                    │   NestJS API     │
                    │   :4000/api      │
                    │   Swagger: /docs │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼──────┐  ┌───▼──────────┐
     │ PostgreSQL  │  │    Redis     │  │  Socket.IO    │
     │ :5433       │  │    :6379     │  │  :4000        │
     │ 49 models   │  │  Sessions    │  │  Real-time    │
     │             │  │  Cache       │  │  Events       │
     └─────────────┘  └─────────────┘  └──────────────┘
```

## Backend Module Architecture

```
NestJS Backend (33 Modules)
│
├── Auth ──────────── JWT, Registration, Login, Password Reset
├── Tenants ───────── Multi-tenant management
├── Branches ──────── Multi-branch per tenant, scope guard
├── Users ─────────── User CRUD, profiles
├── Roles ─────────── RBAC with 56 permissions
│
├── Menu ──────────── Categories, items, variants, add-ons, images
├── Orders ────────── Full lifecycle, items, KOT
├── Tables ────────── Status tracking, floor plans
├── Kitchen ───────── KDS, active/completed orders
├── POS ───────────── Point of sale operations
│
├── Inventory ─────── Stock tracking, adjustments, alerts
├── Suppliers ─────── Supplier management
├── Purchases ─────── Purchase orders
├── Payments ──────── 6 payment methods, refunds
├── Invoices ──────── GST invoice generation
│
├── Staff ─────────── Employee profiles
├── Shifts ────────── Shift scheduling
├── Attendance ────── Clock in/out, reports
├── Reservations ──── Table booking
│
├── Reports ───────── Daily sales, items, categories, payments
├── AI ────────────── AI analytics (planned)
├── Notifications ─── Push notifications
├── Printer ───────── ESC/POS thermal printer integration
├── Sync ──────────── Offline data sync
├── Websockets ────── Socket.IO real-time events
├── Public ────────── Public API for customer pages
│
├── Billing ───────── Subscription lifecycle, grace period, payment promises
├── Plans ─────────── Platform plan management
├── Entitlements ──── Module access control, feature flags
├── Coupons ───────── Coupon engine, festival campaigns
│
├── Admin ─────────── Admin auth (MFA/TOTP), sessions, audit logs
├── Support ───────── Ticket system, conversations
├── Demo Requests ─── Pipeline management
└── Platform ──────── Platform settings, maintenance mode
```

## Multi-Tenancy Model

```
Tenant (Restaurant)
├── Branch (Multiple per tenant)
│   ├── Staff (Assigned to branch)
│   ├── Menu (Branch-specific)
│   ├── Orders (Branch-scoped)
│   ├── Tables (Branch-specific)
│   ├── Inventory (Branch-specific)
│   └── Payments (Branch-scoped)
├── Subscription (One active)
│   ├── Plan → Entitlements (Module access)
│   └── Coupons (Applied discounts)
└── Users (Owners, Managers)
```

## Data Isolation

- **Tenant Isolation**: Every resource has `tenantId` — enforced at query level
- **Branch Isolation**: `BranchScopeGuard` validates branch belongs to tenant
- **Module Access**: `EntitlementsGuard` checks subscription entitlements
- **Role Access**: `PermissionsGuard` checks RBAC permissions
- **Admin Separation**: Separate `admin_users` table, separate JWT secret

## Offline-First Architecture

```
Flutter App (Offline-First)
├── Local SQLite (Drift ORM)
│   ├── LocalTable (synced tables)
│   ├── LocalOrder (pending orders)
│   └── LocalPayment (pending payments)
├── Connectivity Monitor (real-time)
├── Offline Order Service (queue orders)
├── Offline Payment Service (queue payments)
├── Sync Engine (push/pull on reconnect)
└── Connectivity Banner (UI feedback)
```

## Real-time Architecture

```
Socket.IO Events
├── order:created ─────── New order placed
├── order:updated ─────── Order modified
├── order:status-changed ── Status transition
├── order:ready ────────── Order ready to serve
├── table:status-changed ── Table status update
├── menu:updated ────────── Menu item changed
├── kot:ready ──────────── KOT printed
├── payment:received ────── Payment processed
└── payment:refunded ────── Refund processed
```

## Related Documents

- [Project Overview](01_PROJECT_OVERVIEW.md)
- [Tech Stack](06_TECH_STACK.md)
- [Folder Structure](07_FOLDER_STRUCTURE.md)
- [Modules](08_MODULES.md)
- [API Documentation](21_API_DOCUMENTATION.md)
