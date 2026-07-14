# NexaROS Architecture

## Overview

NexaROS is a multi-product, multi-tenant SaaS platform for restaurant operations. Three separate frontends share a single NestJS backend with PostgreSQL.

## System Architecture

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Marketing Web   │  │  Customer Web    │  │  Admin Portal    │
│  (Next.js)       │  │  (Next.js)       │  │  (Next.js)       │
│  :3002           │  │  :3001           │  │  :3003           │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                     │
         └────────────┬───────┴─────────────────────┘
                      │
              ┌───────┴───────┐
              │  NestJS API    │
              │  :4000/api     │
              └───────┬───────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────┴────┐  ┌────┴────┐  ┌───┴────┐
    │PostgreSQL│  │  Redis   │  │ Socket.IO│
    │  :5433   │  │  :6379   │  │  :4000  │
    └─────────┘  └─────────┘  └─────────┘
```

## Products

| Product | Port | Description |
|---------|------|-------------|
| Marketing Web | 3002 | Public website (nexaros.com). Registration, pricing, docs, blog. |
| Customer Web | 3001 | Per-restaurant public page (app.nexaros.com). Menu, ordering, order tracking. |
| Flutter App | — | Restaurant operations (app.nexaros.com). POS, kitchen, inventory, staff, reports. |
| Admin Portal | 3003 | Super Admin dashboard (admin.nexaros.com). Private, never referenced from public site. |

## Backend Modules (30+)

### Core
- **Auth**: JWT auth, registration, login, password reset, token refresh
- **Tenants**: Multi-tenant management with entitlements
- **Branches**: Multi-branch per tenant, branch scope guard
- **Users**: User CRUD, profile management
- **Roles**: RBAC with permissions (56 permissions)

### Operations
- **Menu**: Categories, items, variants, add-ons, images, availability
- **Orders**: Full lifecycle (PENDING → COMPLETED/CANCELLED), items, KOT
- **Tables**: Status tracking (FREE/OCCUPIED/RESERVED/etc.), floor plans
- **Kitchen**: KDS with active/completed orders, status updates
- **POS**: Point of sale operations

### Back Office
- **Inventory**: Stock tracking, adjustments, low-stock alerts
- **Suppliers**: Supplier management
- **Purchases**: Purchase orders, status tracking
- **Payments**: Payment processing (6 methods), refunds
- **Invoices**: GST invoice generation, PDF

### Staff
- **Staff**: Employee profiles, CRUD
- **Shifts**: Shift scheduling
- **Attendance**: Clock in/out, attendance reports
- **Reservations**: Table booking, status management

### Analytics
- **Reports**: Daily sales, items, categories, payments, revenue, hourly, peak hours
- **AI**: AI-powered analytics (future)

### Platform
- **Billing**: Subscription lifecycle, grace period, payment promises
- **Plans**: Platform plan management (Starter, Pro, Business, Enterprise)
- **Entitlements**: Module access control, feature flags
- **Coupons**: Coupon engine, festival campaigns, validation
- **Admin**: Admin auth (MFA/TOTP), sessions, audit logs
- **Support**: Ticket system, conversation threads, internal notes
- **Demo Requests**: Pipeline management (kanban)
- **Platform**: Platform settings, maintenance mode, stats
- **Sync**: Offline data sync
- **Websockets**: Real-time events (Socket.IO)
- **Printer**: ESC/POS thermal printer integration
- **Public**: Public API for customer-facing pages

## Subscription Lifecycle

```
TRIAL (14d) → ACTIVE → PAYMENT_PENDING → GRACE_PERIOD (7d) → RESTRICTED → SUSPENDED (30d) → ARCHIVED (90d)
```

- **Restricted Mode**: Core modules (POS, orders, kitchen, tables, payments, invoices) always work
- **Payment Promise**: Extends access at any stage

## Multi-Tenancy

- Tenant isolation via `tenantId` on all resources
- Branch scoping via `branchId` and `BranchScopeGuard`
- Entitlements check via `EntitlementsGuard` on protected controllers
- Custom entitlements per tenant (overrides plan defaults)

## Offline-First Architecture

- Local SQLite database (Drift ORM) on Flutter app
- Offline order and payment services
- Sync engine pushes/pulls when connectivity returns
- Connectivity banner in all shells

## Key Design Decisions

1. **Entitlements over plan names**: Never `if (plan == "enterprise")`. Always check `entitlements.features['module_key']`
2. **Stub payment provider**: Interface designed for easy swap to Razorpay when keys arrive
3. **Separate admin auth**: `admin_users` table, separate JWT secret, MFA with TOTP
4. **Blog/docs as content-as-code**: Hardcoded in `[slug]/page.tsx`, zero cost, version-controlled
5. **No stock photos**: CSS/SVG illustrations, device mockups
