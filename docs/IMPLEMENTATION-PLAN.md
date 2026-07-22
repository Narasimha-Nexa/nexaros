# NexaROS Complete Implementation Plan

> SaaS • Enterprise • Production-Ready • Real-Time • Offline-First  
> AI-Powered Restaurant Operating System  
> **Version:** 0.1.0 | **Status:** MVP Complete | **Date:** July 2026

---

## Table of Contents

1. [Overall System Architecture](#1-overall-system-architecture)
2. [Project Folder Structure](#2-project-folder-structure)
3. [Database Planning](#3-database-planning)
4. [API Planning](#4-api-planning)
5. [WebSocket Planning](#5-websocket-planning)
6. [RBAC Planning](#6-rbac-planning)
7. [Module Dependency Planning](#7-module-dependency-planning)
8. [Flutter Planning](#8-flutter-planning)
9. [Backend Planning](#9-backend-planning)
10. [Real-Time Planning](#10-real-time-planning)
11. [UI/UX Planning](#11-uiux-planning)
12. [Security Planning](#12-security-planning)
13. [DevOps Planning](#13-devops-planning)
14. [Testing Strategy](#14-testing-strategy)
15. [Development Roadmap](#15-development-roadmap)
16. [Milestones](#16-milestones)
17. [Risks & Mitigations](#17-risks--mitigations)
18. [Documentation](#18-documentation)
19. [Definition of Done](#19-definition-of-done)

---

## 1. Overall System Architecture

### 1.1 System Context

```
                          NEXAROS PLATFORM
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
   Marketing Web          Customer Web          Flutter App
   (Next.js 15)           (Next.js 15 + PWA)    (All Platforms)
   :3002                   :3001                 POS/KDS/Inventory
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                        ┌───────┴───────┐
                        │  NestJS API    │
                        │  :4000/api/v1  │
                        └───────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
              PostgreSQL    Redis      Socket.IO
              :5433         :6379      :4000
                    │           │           │
                    └───────────┴───────────┘
                                │
                    ┌───────────┴───────────┐
                    │   External Services    │
                    │ Razorpay · FCM · SMTP  │
                    │ WhatsApp · Google Maps │
                    │ S3 · Resend · Twilio   │
                    └───────────────────────┘
```

### 1.2 Frontend Architecture (Flutter)

**Pattern:** Clean Architecture + Feature-First + Offline-First

```
┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                        │
│  Screens · Widgets · Shells (Mobile/Tablet/Desktop/TV)       │
├──────────────────────────────────────────────────────────────┤
│                     STATE MANAGEMENT                           │
│  Riverpod (new) · Provider (legacy) · EventBus · Streams      │
├──────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                             │
│  Entities (pure Dart) · Repositories (abstract) · Use Cases  │
├──────────────────────────────────────────────────────────────┤
│                       DATA LAYER                              │
│  Dio (API) · Drift (SQLite) · SharedPreferences · SecureStore │
├──────────────────────────────────────────────────────────────┤
│                      SYNC ENGINE                              │
│  Queue · Conflict Resolution · Delta Sync · Exponential Backoff│
└──────────────────────────────────────────────────────────────┘
```

**Target Platforms:**
- Android (5.0+) - POS terminal, handheld
- iOS (14+) - Staff devices
- Windows 10+ - Desktop POS, back office
- macOS 12+ - Back office, management
- Linux (Ubuntu 22+) - KDS TV displays, POS
- Web (Chrome, Firefox, Safari) - Light POS, menu management

### 1.3 Backend Architecture (NestJS)

**Pattern:** Modular Monolith (microservices-ready)

```
┌──────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                          │
│  Guards (Auth, Roles, Permissions, Throttle)                  │
│  Interceptors (Logging, Timeout, Correlation-ID)              │
│  Filters (AllExceptions, Validation)                          │
│  Middleware (RequestContext, CSRF, RateLimit)                  │
├──────────────────────────────────────────────────────────────┤
│                    CONTROLLER LAYER                           │
│  33+ REST Controllers · 4 WebSocket Gateways · Cron Jobs     │
├──────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                              │
│  Business Logic · Event Publishing · CQRS (where needed)     │
├──────────────────────────────────────────────────────────────┤
│                    REPOSITORY LAYER                           │
│  Prisma Service · Redis Cache · BullMQ Queue Producers       │
├──────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                             │
│  Redis (Cache + Queue + WS Adapter) · BullMQ · EventBus      │
└──────────────────────────────────────────────────────────────┘
```

### 1.4 Multi-Tenant Architecture

**Strategy:** Shared database, row-level tenant isolation via `tenantId`

```
┌───────────────────────────────────────────────────────────────┐
│  Isolation Layers:                                            │
│                                                               │
│  Database:  Every tenant-scoped table has `tenantId` column   │
│  Query:     Prisma middleware auto-injects `WHERE tenantId`   │
│  Context:   RequestContextMiddleware extracts from JWT         │
│  Cache:     Redis keys prefixed `tenant:{id}:`                │
│  Storage:   S3 paths prefixed `tenant/{id}/`                  │
│  WebSocket: Rooms scoped to `tenant:{id}` + `branch:{id}`     │
│                                                               │
│  Bypass:    SUPER_ADMIN role can query across tenants         │
└───────────────────────────────────────────────────────────────┘
```

### 1.5 Authentication Flow

```
Client           AuthGuard          AuthService         Prisma
  │                  │                  │                  │
  │ POST /auth/login │                  │                  │
  │─────────────────►│                  │                  │
  │                  │ authenticate()   │                  │
  │                  │─────────────────►│                  │
  │                  │                  │ verify password  │
  │                  │                  │─────────────────►│
  │                  │                  │◄─────────────────│
  │                  │ generate tokens  │                  │
  │                  │◄─────────────────│                  │
  │◄────────────────│                  │                  │
  │ {accessToken,   │                  │                  │
  │  refreshToken,  │                  │                  │
  │  user, tenant,  │                  │                  │
  │  branches,      │                  │                  │
  │  permissions}   │                  │                  │
```

**Token Strategy:**

| Token | Type | Payload | Expiry | Storage |
|-------|------|---------|--------|---------|
| Access | JWT (HS256) | `sub, tenantId, branchId, roleId, permissions[]` | 15 min | Memory (Flutter) / HTTP-only cookie (Web) |
| Refresh | Opaque UUID (hashed in DB) | None (server lookup via Prisma) | 30 days | `flutter_secure_storage` / HTTP-only cookie |

### 1.6 Authorization Flow

**Dual Gate:** RBAC (role-based) + Entitlements (subscription-based)

```
@Permissions('orders:read')
@Get()
async findAll() { ... }

// Flutter:
PermissionGate(
  permission: Permission.manageMenuItems,
  moduleKey: 'menu',        // subscription entitlement check
  child: MenuEditButton(),
  onUpgrade: () => router.push('/subscription'),
)
```

### 1.7 Caching Strategy

| Layer | Technology | TTL | Invalidation |
|-------|-----------|-----|-------------|
| L1: In-Memory | NestJS CacheManager | 5 min | On mutation events |
| L2: Distributed | Redis (ioredis) | 15-60 min | Cache clear on DB write |
| L3: HTTP | ETag + Last-Modified | Per response | Conditional requests |

### 1.8 Offline-First Sync

```
Local SQLite (Drift)              Remote PostgreSQL
       │                                │
       │──── sync:pull ────────────────►│
       │◄─── full/ delta data ──────────│
       │                                │
       │  ┌──────────────────────┐      │
       │  │  Sync Outbox Table   │      │
       │  │  {action, entity,    │      │
       │  │   payload, version,  │      │
       │  │   retries, status}   │      │
       │  └──────────┬───────────┘      │
       │             │                  │
       │  When online                  │
       │──── push:batch ───────────────►│
       │◄─── {success[], failed[]} ─────│
       │                                │
```

### 1.9 WebSocket Communication

```
Client                    Server (Socket.IO + Redis Adapter)
  │                              │
  │ connect (JWT in auth)        │
  │─────────────────────────────►│
  │                              │ verify + join rooms
  │◄─────────────────────────────│ joined: tenant:{id}
  │                              │ joined: branch:{id}
  │                              │ joined: user:{id}
  │                              │
  │◄── order:created ────────────│
  │◄── order:status-changed ─────│
  │◄── inventory:low-stock ─────│
  │◄── table:status-changed ────│
  │◄── notification:new ────────│
  │◄── kitchen:ready ───────────│
  │◄── delivery:gps-update ─────│
```

---

## 2. Project Folder Structure

### 2.1 Monorepo Root

```
nexaros/
├── apps/
│   ├── backend/                    # NestJS API (194 TS files, 33 modules)
│   ├── flutter-app/                # Flutter (108 Dart files, 26+ screens)
│   ├── marketing-web/              # Next.js public site (nexaros.com)
│   ├── customer-web/               # Next.js per-restaurant site
│   └── admin-portal/               # Next.js super admin (admin.nexaros.com)
├── packages/
│   ├── shared-types/               # TypeScript interfaces/enums
│   ├── shared-constants/           # Business constants
│   ├── validation-rules/           # Cross-app validation schemas
│   └── i18n-resources/             # Shared translation resources
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.marketing
│   ├── Dockerfile.customer
│   ├── Dockerfile.admin
│   └── docker-compose.yml
├── scripts/
│   ├── setup.sh
│   ├── seed.sh
│   └── backup.sh
├── docs/
│   ├── INDEX.md                    # Documentation index
│   ├── ARCHITECTURE.md             # System architecture docs
│   ├── DATABASE.md                 # Database reference
│   ├── API.md                      # API endpoint reference
│   ├── IMPLEMENTATION-PLAN.md      # This file
│   ├── platform/                   # 59 platform documents
│   ├── audits/                     # 8 audit reports
│   └── apps/                       # Per-app READMEs
├── .github/workflows/
│   ├── ci.yml
│   ├── deploy.yml
│   ├── deploy-backend.yml
│   ├── deploy-admin.yml
│   ├── deploy-customer.yml
│   └── deploy-marketing.yml
├── AGENT.md                        # AI agent configuration (434 lines)
├── DESIGN.md                       # Design system (561 lines)
├── DEPLOY.md                       # Deployment guide
├── NexaROS-Complete-Build-Plan.md  # Original build plan (2489 lines)
├── package.json                    # Monorepo root
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── render.yaml
├── railway.toml
└── netlify.toml
```

### 2.2 Backend Structure (NestJS)

```
apps/backend/
├── src/
│   ├── main.ts                         # Bootstrap (Helmet, CORS, Swagger, etc.)
│   ├── app.module.ts                   # Root module (33+ module imports)
│   ├── health.controller.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   └── prisma.service.spec.ts
│   ├── common/
│   │   ├── config/                     # env-validator.ts
│   │   ├── constants/                  # App-wide constants
│   │   ├── decorators/                 # @CurrentUser, @Permissions, @Public
│   │   ├── dto/                        # PaginationDto, etc.
│   │   ├── guards/                     # AuthGuard, PermissionsGuard
│   │   ├── interceptors/               # Logging, Timeout, CorrelationId
│   │   ├── filters/                    # AllExceptionsFilter
│   │   ├── middleware/                 # RequestContext, CSRF, RateLimit
│   │   ├── pipes/                      # ValidationPipe overrides
│   │   ├── redis/                      # RedisModule, RedisIoAdapter
│   │   ├── queue/                      # BullMQ queue module
│   │   ├── workers/                    # Background job processors
│   │   ├── event-bus/                  # EventEmitter module
│   │   └── providers/                  # Razorpay, stub payment gateways
│   └── modules/
│       ├── auth/                       # JWT auth, register, login, refresh
│       ├── tenants/                    # Multi-tenant management
│       ├── branches/                   # Branch CRUD
│       ├── users/                      # User management
│       ├── roles/                      # RBAC roles & permissions
│       ├── menu/                       # Categories, items, variants, add-ons
│       ├── orders/                     # Full order lifecycle
│       ├── tables/                     # Table management, floor plans
│       ├── kitchen/                    # Kitchen Display System
│       ├── payments/                   # Payment processing (6 methods)
│       ├── invoices/                   # GST invoice generation, PDF
│       ├── inventory/                  # Stock, movements, low-stock alerts
│       ├── suppliers/                  # Vendor management
│       ├── purchases/                  # Purchase orders
│       ├── staff/                      # Employee profiles, attendance, shifts
│       ├── reservations/               # Table booking
│       ├── crm/                        # Customers, loyalty, wallet, reviews
│       ├── delivery/                   # Delivery partners, GPS tracking
│       ├── coupons/                    # Coupon engine
│       ├── notifications/              # FCM, email, SMS, WhatsApp
│       ├── reports/                    # Report generation & export
│       ├── ai/                         # AI insights engine
│       ├── printer/                    # Thermal printer support
│       ├── sync/                       # Offline sync push/pull
│       ├── websockets/                 # Socket.IO gateways
│       ├── subscriptions/              # SaaS subscription
│       ├── plans/                      # Plan definitions
│       ├── billing/                    # Subscription payments
│       ├── entitlements/               # Feature flags per plan
│       ├── public/                     # Public endpoints (menu, order tracking)
│       ├── support/                    # Support ticket system
│       ├── admin/                      # Super Admin auth + MFA
│       ├── demo-requests/              # Sales demo pipeline
│       ├── platform/                   # Platform-wide settings
│       └── cms/                        # Website manager (planned)
├── prisma/
│   ├── schema.prisma                   # 61 models, 27 enums, 1630 lines
│   ├── seed.ts                         # Seed data
│   ├── migrations/                     # 6 migration files
│   └── backup_pre_schema_hardening.sql
├── test/                               # E2E tests
├── .env
├── nest-cli.json
├── tsconfig.json
├── package.json                        # 60+ dependencies
└── railway.toml
```

### 2.3 Flutter App Structure

```
apps/flutter-app/
├── lib/
│   ├── main.dart                       # Entry point with MultiProvider setup
│   ├── app/
│   │   ├── app.dart                    # MaterialApp with theme, router, i18n
│   │   └── router.dart                 # GoRouter with shell routes (150+ routes)
│   ├── core/
│   │   ├── constants/                  # API endpoints, app constants
│   │   ├── theme/                      # Light/dark theme definitions
│   │   ├── i18n/                       # Localization delegates
│   │   ├── network/
│   │   │   ├── api_client.dart         # Dio with auth/retry/connectivity interceptors
│   │   │   ├── auth_interceptor.dart
│   │   │   └── retry_interceptor.dart
│   │   ├── database/
│   │   │   ├── app_database.dart       # Drift database
│   │   │   ├── tables/                 # Drift table definitions
│   │   │   └── daos/                   # Data access objects
│   │   ├── sync/
│   │   │   └── sync_engine.dart        # Queue processor + conflict resolver
│   │   ├── services/
│   │   │   ├── event_bus.dart
│   │   │   └── sound_service.dart
│   │   ├── providers/
│   │   │   ├── app_state.dart          # Global app state
│   │   │   ├── role_provider.dart
│   │   │   ├── branch_provider.dart
│   │   │   └── subscription_provider.dart
│   │   └── widgets/
│   │       ├── require_permission.dart  # PermissionGate, RequirePermission
│   │       ├── sync_status_bar.dart
│   │       ├── branch_switcher.dart
│   │       ├── connectivity_banner.dart
│   │       ├── feature_locked_overlay.dart
│   │       └── ... (25+ shared widgets)
│   ├── features/
│   │   ├── auth/                        # Auth screens + provider
│   │   ├── dashboard/                   # Dashboard + executive dashboard
│   │   ├── orders/                      # Order list, detail, timeline, history
│   │   ├── tables/                      # Floor layout, table grid, queue
│   │   ├── pos/                         # POS, cart, checkout, split, discounts
│   │   ├── menu/                        # Categories, items, variants, combos
│   │   ├── kitchen/                     # KDS dashboard, queue, preparing, ready
│   │   ├── inventory/                   # Stock, purchases, suppliers, waste
│   │   ├── crm/                         # Customers, loyalty, wallet, reviews
│   │   ├── delivery/                    # Dashboard, partners, tracking, history
│   │   ├── reservations/                # Calendar, details, walk-ins, waiting
│   │   ├── staff/                       # Employees, attendance, shifts, payroll
│   │   ├── finance/                     # Dashboard, income, expenses, tax
│   │   ├── analytics/                   # Sales, customer, inventory, kitchen
│   │   ├── reports/                     # Charts, exports
│   │   ├── website/                     # CMS editor (planned)
│   │   ├── marketing/                   # Campaigns (planned)
│   │   ├── subscriptions/               # Plan, upgrade, billing history
│   │   ├── settings/                    # Profile, printers, notifications
│   │   ├── support/                     # Help center, tickets, FAQ
│   │   ├── branches/                    # Branch management
│   │   ├── offers/                      # Coupon management
│   │   ├── more/                        # Overflow menu
│   │   └── onboarding/                  # Splash, welcome, restaurant/branch select
│   └── shells/
│       ├── mobile_shell.dart            # BottomNavigationBar (5 tabs)
│       ├── tablet_shell.dart            # Adaptive two-pane
│       ├── desktop_shell.dart           # Sidebar + multi-panel workspace
│       └── tv_shell.dart                # Full-screen KDS
├── assets/
│   ├── images/
│   ├── icons/
│   └── sounds/
├── test/
│   ├── receipt_formatter_test.dart
│   └── widget/unit tests...
├── pubspec.yaml                         # 40+ dependencies
├── analysis_options.yaml
└── .metadata
```

---

## 3. Database Planning

### 3.1 Complete Schema Overview

**Total:** 61 models, 27 enums, 1630 lines of Prisma schema

**Domain Clusters:**

| Cluster | Models | Description |
|---------|--------|-------------|
| **Tenant** | Tenant | Multi-tenant root |
| **Auth** | User, RefreshToken, AdminUser, AdminSession | Authentication |
| **RBAC** | Role, Permission, RolePermission | Access control |
| **Branch** | Branch | Multi-branch per tenant |
| **Staff** | Staff, Attendance, Shift, StaffShift, Leave | HR management |
| **Menu** | Category, MenuItem, MenuItemImage, MenuItemVariant, MenuItemAddOn | Menu catalog |
| **Order** | Order, OrderItem | Transactions |
| **Table** | RestaurantTable | Floor management |
| **Inventory** | InventoryItem, InventoryMovement, RecipeItem | Stock control |
| **Supply** | Supplier, Purchase, PurchaseItem | Procurement |
| **Payment** | Payment, PaymentSplit | Financial transactions |
| **Invoice** | Invoice, InvoiceItem | Accounting |
| **Customer** | Customer, LoyaltyTransaction, WalletTransaction, Review | CRM |
| **Reservation** | Reservation, ReservationGuest | Table booking |
| **Delivery** | DeliveryPartner, Delivery, DeliveryLocation | Logistics |
| **Finance** | Expense, ExpenseCategory | Accounting |
| **Subscription** | Subscription, SubscriptionPayment, SubscriptionInvoice, PlatformPlan, PlanEntitlement | SaaS billing |
| **Coupon** | Coupon, CouponUsage | Promotions |
| **Platform** | PlatformSettings, FeatureFlag, TenantFeatureFlag | Platform config |
| **Support** | SupportTicket, TicketMessage | Support |
| **Demo** | DemoRequest, DemoNote | Sales pipeline |
| **CMS** | TenantWebsiteConfig | Website manager |
| **Audit** | AuditLog, NotificationLog | Observability |
| **Billing** | PaymentPromise | Payment recovery |

### 3.2 Key Relationships

```
Tenant (1) ── (N) Branch
Tenant (1) ── (N) User
Tenant (1) ── (N) Role
Tenant (1) ── (N) Category ── (N) MenuItem
Tenant (1) ── (N) InventoryItem
Tenant (1) ── (N) Supplier ── (N) Purchase
Tenant (1) ── (N) Subscription ── (1) PlatformPlan
Tenant (1) ── (1) TenantWebsiteConfig
Tenant (1) ── (N) SupportTicket ── (N) TicketMessage
Tenant (1) ── (N) AuditLog
Tenant (1) ── (N) CouponUsage

Branch (1) ── (N) RestaurantTable
Branch (1) ── (N) Order ── (N) OrderItem ── (1) MenuItem
Branch (1) ── (N) Staff ── (N) Attendance
Branch (1) ── (N) Payment ── (N) PaymentSplit
Branch (1) ── (N) Reservation
Branch (1) ── (N) Expense

User (1) ── (N) RefreshToken
User (1) ── (0..1) Staff

MenuItem (1) ── (N) MenuItemVariant
MenuItem (1) ── (N) MenuItemAddOn
MenuItem (1) ── (N) MenuItemImage
MenuItem (1) ── (N) RecipeItem (N) ── (1) InventoryItem
MenuItem (1) ── (N) OrderItem

Order (1) ── (1) Invoice ── (N) InvoiceItem
Order (1) ── (N) Delivery ── (1) DeliveryPartner

Customer (1) ── (N) Review
Customer (1) ── (N) LoyaltyTransaction
Customer (1) ── (1) WalletTransaction
Customer (1) ── (N) Reservation

Staff (1) ── (N) StaffShift (N) ── (1) Shift
Staff (1) ── (N) Leave
Staff (1) ── (N) Order (as waiter)

PlatformPlan (1) ── (N) PlanEntitlement
PlatformPlan (1) ── (N) Subscription
Coupon (1) ── (N) CouponUsage
```

### 3.3 Enums (27)

```
UserRole, StaffStatus, OrderStatus, OrderType, TableStatus,
PaymentMethod, PaymentStatus, InvoiceStatus, ReservationStatus,
SubscriptionStatus, BillingCycle, TicketStatus, TicketPriority,
DemoStatus, ShiftType, AttendanceStatus, LeaveStatus,
ExpenseCategory, InventoryMovementType, DeliveryStatus,
DeliveryPartnerStatus, FeatureToggleScope, BusinessType,
MenuItemDietType, CouponType, CouponDiscountType, CouponScope
```

### 3.4 Indexing Strategy

**Mandatory Indexes (already implemented in schema):**

| Table | Index | Purpose |
|-------|-------|---------|
| ALL tenant-scoped | `@@index([tenantId])` | Tenant isolation |
| Branch | `@@index([tenantId])` | Tenant queries |
| User | `@@unique([email])`, `@@unique([phone])` | Auth lookups |
| Order | `@@index([tenantId, branchId, status])`, `@@index([branchId, createdAt])` | Dashboard queries |
| OrderItem | `@@index([orderId])` | Order detail |
| MenuItem | `@@index([categoryId])`, `@@index([barcode])` | Menu queries |
| Payment | `@@index([orderId])` | Payment lookup |
| Staff | `@@index([branchId])` | Branch staff |
| Attendance | `@@index([staffId, date])` | Daily attendance |
| Role | `@@unique([tenantId, name])` | Role lookup |
| Permission | `@@unique([module, action])` | Unique permissions |
| Subscription | `@@index([tenantId, status])` | Billing queries |
| Coupon | `@@unique([code])` | Coupon validation |
| AuditLog | `@@index([tenantId, createdAt])` | Audit trail |
| SupportTicket | `@@index([tenantId, status])` | Support queries |
| Reservation | `@@index([branchId, date, status])` | Calendar queries |

### 3.5 Soft Delete & Audit

Every operational model includes:
- `deletedAt DateTime?` — logical deletion, queries filter `WHERE deletedAt IS NULL`
- `version Int @default(1)` — optimistic concurrency for offline sync
- `createdBy String?`, `updatedBy String?` — audit trail
- `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`

### 3.6 Tenant Isolation

Enforced at three layers:
1. **RequestContextMiddleware** — extracts `tenantId` from JWT into `AsyncLocalStorage`
2. **Prisma middleware** — auto-injects `WHERE tenantId = {current}` for tenant-scoped models
3. **Repository layer** — explicit `where: { tenantId }` in service methods

---

## 4. API Planning

### 4.1 Existing API Endpoints (107+, 32 controllers)

**Authentication** (`/api/v1/auth`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| POST | `/auth/refresh` | No |
| POST | `/auth/logout` | Yes |
| GET | `/auth/profile` | Yes |
| POST | `/auth/forgot-password` | No |
| POST | `/auth/reset-password` | No |
| PATCH | `/auth/profile` | Yes |

**Tenants** (`/api/v1/tenants`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/tenants` | Admin |
| GET | `/tenants/:id` | Admin |
| POST | `/tenants/:id/suspend` | Admin |
| POST | `/tenants/:id/activate` | Admin |

**Branches** (`/api/v1/branches`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/branches` | Yes |
| POST | `/branches` | Yes |
| GET | `/branches/:id` | Yes |
| PATCH | `/branches/:id` | Yes |

**Users** (`/api/v1/users`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/users` | Yes |
| POST | `/users` | Yes |
| GET | `/users/:id` | Yes |
| PATCH | `/users/:id` | Yes |

**Roles** (`/api/v1/roles`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/roles` | Yes |
| POST | `/roles` | Yes |
| PATCH | `/roles/:id` | Yes |
| GET | `/roles/permissions` | Yes |

**Menu** (`/api/v1/menu`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/menu/categories` | Yes |
| POST | `/menu/categories` | Yes |
| PATCH | `/menu/categories/:id` | Yes |
| DELETE | `/menu/categories/:id` | Yes |
| GET | `/menu/items` | Yes |
| POST | `/menu/items` | Yes |
| PATCH | `/menu/items/:id` | Yes |
| DELETE | `/menu/items/:id` | Yes |
| PATCH | `/menu/items/:id/availability` | Yes |

**Orders** (`/api/v1/orders`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/orders` | Yes |
| POST | `/orders` | Yes |
| GET | `/orders/:id` | Yes |
| PATCH | `/orders/:id/status` | Yes |
| POST | `/orders/:id/items` | Yes |
| DELETE | `/orders/:id/items/:itemId` | Yes |
| POST | `/orders/:id/kot` | Yes |
| POST | `/orders/:id/cancel` | Yes |

**Tables** (`/api/v1/tables`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/tables` | Yes |
| GET | `/tables/floor-plan` | Yes |
| PATCH | `/tables/:id/status` | Yes |

**Payments** (`/api/v1/payments`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/payments/orders/:orderId` | Yes |
| GET | `/payments/orders/:orderId` | Yes |

**Invoices** (`/api/v1/invoices`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/invoices/payments/:paymentId` | Yes |
| GET | `/invoices` | Yes |
| GET | `/invoices/:id/pdf` | Yes |

**Inventory** (`/api/v1/inventory`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/inventory` | Yes |
| POST | `/inventory` | Yes |
| PATCH | `/inventory/:id` | Yes |
| DELETE | `/inventory/:id` | Yes |
| POST | `/inventory/:id/adjust` | Yes |
| GET | `/inventory/low-stock` | Yes |

**Staff** (`/api/v1/staff`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/staff` | Yes |
| POST | `/staff` | Yes |
| PATCH | `/staff/:id` | Yes |
| DELETE | `/staff/:id` | Yes |
| POST | `/staff/:id/clock-in` | Yes |
| POST | `/staff/:id/clock-out` | Yes |

**Kitchen** (`/api/v1/kitchen`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/kitchen/orders` | Yes |
| GET | `/kitchen/orders/completed` | Yes |
| PATCH | `/kitchen/orders/:id/status` | Yes |
| GET | `/kitchen/orders/:orderId/kot` | Yes |

**Reservations** (`/api/v1/reservations`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/reservations` | Yes |
| GET | `/reservations/today` | Yes |
| POST | `/reservations` | Yes |
| PATCH | `/reservations/:id` | Yes |
| DELETE | `/reservations/:id` | Yes |

**Reports** (`/api/v1/reports`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/reports/:type` | Yes |
| GET | `/reports/export/:type` | Yes |

**Sync** (`/api/v1/sync`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/sync/push` | Yes |
| GET | `/sync/pull` | Yes |

**Public** (`/api/v1/public`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/public/menu/:slug` | No |
| POST | `/public/orders` | No |
| GET | `/public/orders/:id/track` | No |

**Billing & Subscriptions** (`/api/v1/billing`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/billing/entitlements/:tenantId` | No |
| POST | `/billing/checkout` | No |
| POST | `/billing/transition` | Admin |
| POST | `/billing/payment-promise` | No |
| GET | `/billing/invoices/:tenantId` | No |
| GET | `/billing/payments/:tenantId` | No |
| GET | `/billing/admin/subscriptions` | Admin |
| GET | `/billing/admin/expiring-soon` | Admin |

**Entitlements** (`/api/v1/entitlements`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/entitlements/modules` | No |
| GET | `/entitlements/plans` | No |
| GET | `/entitlements/plans/:slug` | No |
| POST | `/entitlements/plans` | Admin |
| PUT | `/entitlements/plans/:planId/entitlements` | Admin |
| GET | `/entitlements/feature-flags/:tenantId` | No |
| POST | `/entitlements/feature-flags` | Admin |

**Coupons** (`/api/v1/coupons`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/coupons/validate` | No |
| POST | `/coupons` | Admin |
| GET | `/coupons` | Admin |
| PUT | `/coupons/:id` | Admin |
| GET | `/coupons/:id/stats` | Admin |
| POST | `/coupons/apply` | Admin |
| POST | `/coupons/festival-campaign` | Admin |

**Admin** (`/api/v1/admin`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/admin/login` | No |
| POST | `/admin/logout` | Admin |
| GET | `/admin/profile` | Admin |
| POST | `/admin/mfa/setup` | Admin |
| POST | `/admin/mfa/verify` | Admin |
| GET | `/admin/sessions` | Admin |
| POST | `/admin/sessions/:id/revoke` | Admin |
| GET | `/admin/audit-logs` | Admin |

**Support** (`/api/v1/support`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/support/tickets` | Admin |
| POST | `/support/tickets` | No |
| GET | `/support/tickets/:id` | Admin |
| POST | `/support/tickets/:id/messages` | Admin |
| PATCH | `/support/tickets/:id/status` | Admin |

**Demo Requests** (`/api/v1/demo-requests`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/demo-requests` | No |
| GET | `/demo-requests` | Admin |
| PATCH | `/demo-requests/:id/status` | Admin |

**Platform** (`/api/v1/platform`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/platform/settings` | Admin |
| PATCH | `/platform/settings` | Admin |
| GET | `/platform/stats` | Admin |

**Health** (`/api/v1/health`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |

### 4.2 Planned New API Endpoints

**CRM** (expand)
| Method | Path | Auth |
|--------|------|------|
| GET | `/crm/customers` | Yes |
| GET | `/crm/customers/:id` | Yes |
| POST | `/crm/customers` | Yes |
| PATCH | `/crm/customers/:id` | Yes |
| POST | `/crm/customers/:id/loyalty` | Yes |
| POST | `/crm/customers/:id/wallet` | Yes |
| GET | `/crm/reviews` | Yes |
| POST | `/crm/reviews` | Yes |

**Delivery** (expand)
| Method | Path | Auth |
|--------|------|------|
| GET | `/delivery/partners` | Yes |
| POST | `/delivery/partners` | Yes |
| POST | `/delivery/assign` | Yes |
| GET | `/delivery/tracking/:id` | Yes |
| GET | `/delivery/history` | Yes |

**Website Manager** (new)
| Method | Path | Auth |
|--------|------|------|
| GET | `/cms/sections` | Yes |
| POST | `/cms/sections` | Yes |
| PATCH | `/cms/sections/:id` | Yes |
| POST | `/cms/publish` | Yes |
| GET | `/cms/preview` | Yes |

**Marketing** (new)
| Method | Path | Auth |
|--------|------|------|
| GET | `/marketing/campaigns` | Yes |
| POST | `/marketing/campaigns` | Yes |
| POST | `/marketing/campaigns/:id/send` | Yes |
| GET | `/marketing/templates` | Yes |
| POST | `/marketing/templates` | Yes |

**Analytics** (expand)
| Method | Path | Auth |
|--------|------|------|
| GET | `/analytics/sales` | Yes |
| GET | `/analytics/customers` | Yes |
| GET | `/analytics/inventory` | Yes |
| GET | `/analytics/staff` | Yes |
| GET | `/analytics/kitchen` | Yes |
| GET | `/analytics/delivery` | Yes |

**AI** (expand)
| Method | Path | Auth |
|--------|------|------|
| GET | `/ai/insights` | Yes |
| GET | `/ai/forecast/sales` | Yes |
| GET | `/ai/forecast/demand` | Yes |
| GET | `/ai/forecast/inventory` | Yes |
| POST | `/ai/ask` | Yes |

**Auth** (additional)
| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/setup-mfa` | Yes |
| POST | `/auth/verify-mfa` | Yes |
| POST | `/auth/enable-biometric` | Yes |

**Upload**
| Method | Path | Auth |
|--------|------|------|
| POST | `/upload` | Yes |
| DELETE | `/upload/:id` | Yes |

**Printers**
| Method | Path | Auth |
|--------|------|------|
| GET | `/printers` | Yes |
| POST | `/printers` | Yes |
| POST | `/printers/:id/test` | Yes |

### 4.3 API Response Contract

```typescript
// Success (single)
{
  "success": true,
  "data": { ... }
}

// Success (paginated list)
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "INVENTORY_LOW_STOCK",
    "message": "Stock below minimum threshold",
    "statusCode": 409,
    "details": { "current": 5, "minimum": 20 }
  },
  "correlationId": "corr-abc-123"
}
```

### 4.4 Validation & Error Handling

- **Validation:** `class-validator` decorators on DTOs, whitelist mode
- **HTTP Errors:** Custom exception classes mapped to error codes
- **Business Errors:** Domain-specific codes (e.g., `ORDER_ALREADY_PAID`, `TABLE_OCCUPIED`)
- **Global Filter:** `AllExceptionsFilter` catches unhandled, logs with correlation ID

---

## 5. WebSocket Planning

### 5.1 Event Catalog

```
┌────────────────────────────────────────────────────────────────┐
│                    WEBSOCKET EVENTS (25+)                       │
├────────────────────────────────────────────────────────────────┤
│  ORDER EVENTS:                                                 │
│  ├── order:created        →  New order placed                  │
│  ├── order:updated        →  Items modified                    │
│  ├── order:status-changed →  Status transition                 │
│  ├── order:kot-printed    →  KOT dispatched                    │
│  ├── order:cancelled      →  Order cancelled                   │
│  └── order:payment-done   →  Payment completed                 │
├────────────────────────────────────────────────────────────────┤
│  KITCHEN EVENTS:                                               │
│  ├── kitchen:new-order    →  New order on KDS                  │
│  ├── kitchen:started      →  Chef started preparing            │
│  ├── kitchen:ready        →  Food ready to serve               │
│  └── kitchen:delay-alert  →  Exceeded prep time                │
├────────────────────────────────────────────────────────────────┤
│  TABLE EVENTS:                                                 │
│  ├── table:status-changed →  Occupied/free/cleaning            │
│  ├── table:bill-requested →  Customer asked for bill           │
│  └── table:waiter-called  →  Customer called waiter            │
├────────────────────────────────────────────────────────────────┤
│  PAYMENT EVENTS:                                               │
│  ├── payment:completed    →  Payment successful                │
│  └── payment:refunded     →  Refund processed                  │
├────────────────────────────────────────────────────────────────┤
│  INVENTORY EVENTS:                                             │
│  ├── inventory:updated    →  Stock quantity changed            │
│  ├── inventory:low-stock  →  Below reorder level               │
│  └── inventory:expiring   →  Item nearing expiry               │
├────────────────────────────────────────────────────────────────┤
│  RESERVATION EVENTS:                                           │
│  ├── reservation:created  →  New booking                       │
│  ├── reservation:arrived  →  Guest arrived                     │
│  └── reservation:cancelled → Booking cancelled                 │
├────────────────────────────────────────────────────────────────┤
│  STAFF EVENTS:                                                 │
│  ├── staff:clock-in       →  Employee started shift            │
│  └── staff:clock-out      →  Employee ended shift              │
├────────────────────────────────────────────────────────────────┤
│  DELIVERY EVENTS:                                              │
│  ├── delivery:assigned    →  Partner assigned                  │
│  ├── delivery:picked-up   →  Food picked up                    │
│  ├── delivery:gps-update  →  Location changed                  │
│  └── delivery:delivered   →  Reached customer                  │
├────────────────────────────────────────────────────────────────┤
│  NOTIFICATION EVENTS:                                          │
│  └── notification:new     →  New alert for user                │
├────────────────────────────────────────────────────────────────┤
│  SYSTEM EVENTS:                                                │
│  ├── sync:completed       →  Offline sync finished             │
│  ├── sync:conflict        →  Sync conflict detected            │
│  └── system:maintenance   →  Scheduled downtime                │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Room Architecture

```
Socket.IO Rooms:
  user:{userId}       →  Personal notifications & alerts
  tenant:{tenantId}   →  All tenant-wide broadcasts
  branch:{branchId}   →  Branch-specific operations
  role:{roleId}       →  Role-targeted broadcasts (all chefs)
  table:{tableId}     →  Specific table events
  order:{orderId}     →  Order tracking for customer web
```

### 5.3 Redis Adapter for Scale

Multi-instance Socket.IO uses `@socket.io/redis-adapter` to broadcast events across all server instances.

```
Client A ──► Server 1 ──► Redis Pub/Sub ──► Server 2 ──► Client B
```

---

## 6. RBAC Planning

### 6.1 Role Definitions (13 Roles)

| Role ID | Role Name | Scope |
|---------|-----------|-------|
| `OWNER` | Restaurant Owner | Tenant-wide full access |
| `BRANCH_MANAGER` | Branch Manager | Single branch operations |
| `OPS_MANAGER` | Operations Manager | Multi-branch oversight |
| `CASHIER` | Cashier | POS, payments, receipts |
| `WAITER` | Waiter / Captain | Orders, tables, service |
| `CHEF` | Chef / Kitchen Staff | KDS only |
| `INV_MANAGER` | Inventory Manager | Stock, purchases, suppliers |
| `DELIVERY_PARTNER` | Delivery Partner | Delivery tracking |
| `RECEPTIONIST` | Receptionist | Reservations, walk-ins |
| `ACCOUNTANT` | Accountant | Finance, invoices, reports |
| `MARKETING_MGR` | Marketing Manager | Campaigns, promotions |
| `HR_MANAGER` | HR Manager | Staff, attendance, payroll |
| `SUPER_ADMIN` | Super Admin (SaaS company) | Platform-wide |

### 6.2 Permissions Matrix (56 Permissions)

Permission format: `{module}:{action}` where action ∈ {read, create, update, delete, manage}

| Module | Actions | Roles |
|--------|---------|-------|
| `dashboard` | read | ALL |
| `orders` | read, create, update-status, cancel, manage | OWNER, BRANCH_MGR, CASHIER, WAITER |
| `tables` | read, update-status, assign | OWNER, BRANCH_MGR, WAITER, RECEPTIONIST |
| `menu` | read, create, update, delete, manage | OWNER, BRANCH_MGR |
| `kitchen` | read, update-status | CHEF, OWNER, BRANCH_MGR |
| `inventory` | read, create, update, adjust, manage | OWNER, INV_MANAGER, BRANCH_MGR |
| `pos` | read, create, payment, refund, discount | CASHIER, OWNER |
| `payments` | read, refund, manage | OWNER, ACCOUNTANT, CASHIER |
| `staff` | read, create, update, manage | OWNER, HR_MGR, BRANCH_MGR |
| `attendance` | read, create, manage | OWNER, HR_MGR |
| `shifts` | read, create, manage | OWNER, HR_MGR, BRANCH_MGR |
| `reservations` | read, create, update, manage | OWNER, BRANCH_MGR, RECEPTIONIST |
| `customers` | read, create, update | OWNER, BRANCH_MGR, CASHIER |
| `loyalty` | read, create, manage | OWNER, MARKETING_MGR |
| `delivery` | read, assign, track, manage | OWNER, BRANCH_MGR, DELIVERY_PARTNER |
| `finance` | read, create, manage | OWNER, ACCOUNTANT |
| `reports` | read, export | OWNER, BRANCH_MGR, ACCOUNTANT, OPS_MGR |
| `analytics` | read | OWNER, BRANCH_MGR, OPS_MGR |
| `marketing` | read, create, send, manage | OWNER, MARKETING_MGR |
| `website` | read, update, publish | OWNER, MARKETING_MGR |
| `settings` | read, update | OWNER, BRANCH_MGR |
| `roles` | read, manage | OWNER, SUPER_ADMIN |
| `users` | read, create, manage | OWNER, SUPER_ADMIN |
| `branches` | read, create, manage | OWNER, OPS_MGR, SUPER_ADMIN |
| `ai` | read, ask | OWNER, BRANCH_MGR |
| `support` | read, create, manage | ALL |
| `audit` | read | OWNER, SUPER_ADMIN |
| `platform` | manage | SUPER_ADMIN |

### 6.3 Enforcement Points

**Backend (NestJS):**
```typescript
@UseGuards(AuthGuard, PermissionsGuard)
@Permissions('orders:read')
@Get()
async findAll() { ... }
```

**Frontend (Flutter):**
```dart
// Role + subscription dual gate
PermissionGate(
  permission: Permission.manageReports,
  moduleKey: 'reports',
  child: ReportsDashboard(),
  onUpgrade: () => router.push('/subscription'),
)

// Simple permission check
RequirePermission(
  permission: Permission.manageMenuItems,
  child: MenuEditButton(),
)
```

---

## 7. Module Dependency Planning

### 7.1 Dependency Graph

```
Tenant (Foundation)
  ├── Branch
  │    ├── Table ─── Reservation
  │    ├── Staff ─── Attendance, Shift, Leave
  │    ├── Order ─── OrderItem → MenuItem, Payment, Invoice, Delivery, KOT → Kitchen
  │    ├── Inventory ─── RecipeItem → MenuItem, Supplier → Purchase, Movement
  │    └── Customer (CRM) ─── Loyalty, Wallet, Review
  ├── User ─── Role ─── Permission
  ├── Menu ─── Category, MenuItem → Variant/AddOn/Image, RecipeItem → InventoryItem
  ├── Finance ─── Income/Expense, Tax, Invoice
  ├── Notification
  ├── Report / Analytics
  ├── AI
  ├── Marketing
  ├── Website (CMS)
  ├── Support
  └── Subscription ─── Plan ─── Entitlement
```

### 7.2 Shared Services

| Shared Service | Owned By | Consumed By |
|---------------|----------|-------------|
| PrismaService | prisma module | ALL modules |
| RedisService | redis module | Cache, Queue, Session, WS |
| EventBusService | event-bus module | Cross-module async events |
| Queue (BullMQ) | queue module | Background jobs across all modules |
| NotificationService | notifications module | Orders, Kitchen, CRM, Marketing |
| FileUploadService | Upload module | Menu, CMS, Documents |
| PaymentGateway | payments module | POS, Invoices, Subscriptions |
| ReportingEngine | reports module | Analytics, Finance |
| AIService | ai module | Analytics, Marketing, Insights |
| PrinterService | printer module | Orders, POS, Kitchen |
| SyncService | sync module | ALL offline modules |
| AuthGuard | auth module | ALL protected routes |
| PermissionsGuard | roles module | ALL guarded routes |
| TenantContext | middleware | ALL tenant-scoped queries |

### 7.3 Dependency Rules

1. **Core modules** (Tenant, Branch, User, Role) have **zero** dependencies on operational modules
2. **Operational modules** (Order, Menu, Inventory) depend only on Core + each other via **events**
3. **Reporting/Analytics modules** depend on Operational modules (read-only via Prisma/reports)
4. **Cross-cutting modules** (Notification, AI) consume via **EventBus**, never direct imports
5. **No circular dependencies** enforced via NestJS module imports + event-driven architecture

---

## 8. Flutter Planning

### 8.1 Per-Module Screen Map

| Module | Screens | State |
|--------|---------|-------|
| **Auth** | Splash, Welcome, Login, Signup, OTP, ForgotPwd, ResetPwd, MFA, Biometric, RestaurantSelect, BranchSelect, ProfileSetup | AuthProvider |
| **Dashboard** | Dashboard, ExecutiveDashboard, Notifications, GlobalSearch, AI Assistant | AppState |
| **Orders** | LiveOrders, DineIn, Takeaway, Delivery, Scheduled, OrderDetail, OrderTimeline, OrderHistory | OrdersProvider |
| **Tables** | FloorLayout, TableGrid, TableDetail, QROrdering, WaitingQueue | TablesProvider |
| **POS** | POS, Cart, Checkout, SplitBill, Discounts, Payments, Receipt, Refunds, ShiftClosing | POSProvider |
| **Menu** | Categories, MenuItems, ItemForm, Variants, AddOns, Combos, Pricing, Availability, Offers | MenuProvider |
| **Kitchen** | KDSDashboard, CookingQueue, Preparing, ReadyToServe, Completed, KitchenAnalytics | KitchenProvider |
| **Inventory** | Dashboard, StockItems, Ingredients, PurchaseOrders, Vendors, GoodsReceived, Transfers, Adjustments, LowStock, Wastage, RecipeCosting | InventoryProvider |
| **CRM** | Customers, CustomerProfile, Loyalty, Membership, Wallet, Reviews | CRMProvider |
| **Delivery** | Dashboard, Partners, Assign, GPSTracking, History | DeliveryProvider |
| **Reservations** | Calendar, Detail, WalkIns, WaitingList | ReservationsProvider |
| **Staff** | Dashboard, Employees, EmployeeProfile, Attendance, Shifts, Leave, Payroll, Roles & Permissions | StaffProvider |
| **Finance** | Dashboard, Income, Expenses, Transactions, Tax, Invoices, Reports | FinanceProvider |
| **Analytics** | Sales, Customer, Inventory, Staff, Kitchen, Delivery | AnalyticsProvider |
| **Website** | Dashboard, Homepage, MenuWeb, Gallery, Contact, Theme, SEO, Preview, Publish | CMSProvider |
| **Marketing** | Campaigns, Push, WhatsApp, Email, SMS, Referral | MarketingProvider |
| **Reports** | Daily, Weekly, Monthly, Inventory, Financial, Staff, Export | ReportsProvider |
| **Subscriptions** | CurrentPland, UpgradePlan, BillingHistory, PaymentMethods, Usage | SubscriptionProvider |
| **Settings** | Profile, Settings, Printers, Diagnostics, Notifications | SettingsProvider |
| **Support** | HelpCenter, Tickets, FAQ, About, Privacy, Terms | SupportProvider |

### 8.2 Responsive Shells

**Mobile Shell** (<600px):
- `BottomNavigationBar` with 5 tabs: Dashboard, Orders, Menu, POS, More
- Full-screen push navigation within tabs
- FAB for primary actions
- Drawer for profile/settings

**Tablet Shell** (600-1024px):
- `NavigationRail` (narrow sidebar)
- Master-Detail split pane (list on left, detail on right)
- Popover modal instead of full-screen push

**Desktop Shell** (>1024px):
- Persistent `NavigationDrawer` (full sidebar with all modules)
- Multi-panel workspace (nav + list + detail + context)
- Floating panels: AI assistant, notifications
- Keyboard shortcuts (Ctrl+N = New Order, Ctrl+K = Search)

**TV Shell** (Kitchen Display):
- Full-screen KDS with no navigation chrome
- Auto-scrolling order queue with color-coded status
- Large touch targets for status updates
- Sound alerts for new orders

### 8.3 Route Structure (GoRouter — 150+ routes)

```
/splash → /welcome → /auth/login → /auth/mfa → /restaurant-selection → /branch-selection → /profile-setup → /dashboard

Shell routes for authenticated app:
/dashboard
/dashboard/executive
/dashboard/notifications
/dashboard/search
/dashboard/ai-assistant

/orders → /orders/:id → /orders/:id/timeline
/orders/history

/tables → /tables/floor-plan → /tables/:id
/tables/queue

/pos → /pos/cart → /pos/checkout → /pos/payment → /pos/receipt
/pos/split-bill
/pos/discounts
/pos/shift-closing

/menu → /menu/categories → /menu/items/new → /menu/items/:id/edit
/menu/variants/:id
/menu/addons/:id
/menu/combos
/menu/pricing
/menu/offers

/kitchen → /kitchen/queue → /kitchen/preparing → /kitchen/ready → /kitchen/completed
/kitchen/analytics

/inventory → /inventory/items → /inventory/ingredients
/inventory/purchase-orders → /inventory/goods-received
/inventory/vendors
/inventory/transfers
/inventory/adjustments
/inventory/low-stock
/inventory/wastage
/inventory/recipe-costing

/crm/customers → /crm/customers/:id
/crm/loyalty
/crm/membership
/crm/wallet
/crm/reviews

/delivery → /delivery/partners → /delivery/assign
/delivery/tracking/:id
/delivery/history

/reservations → /reservations/:id
/reservations/walk-ins
/reservations/waiting-list

/staff → /staff/employees → /staff/employees/:id
/staff/attendance
/staff/shifts
/staff/leaves
/staff/payroll
/staff/roles

/finance → /finance/income → /finance/expenses
/finance/transactions
/finance/tax
/finance/invoices
/finance/reports

/analytics/sales → /analytics/customers → /analytics/inventory → /analytics/staff → /analytics/kitchen → /analytics/delivery

/website → /website/homepage → /website/menu → /website/gallery → /website/contact → /website/theme → /website/seo → /website/preview → /website/publish

/marketing → /marketing/push → /marketing/whatsapp → /marketing/email → /marketing/sms → /marketing/referral

/reports → /reports/inventory → /reports/financial → /reports/staff → /reports/export

/subscription → /subscription/upgrade → /subscription/billing → /subscription/payment-methods → /subscription/usage

/settings → /settings/profile → /settings/printers → /settings/printer-diagnostic → /settings/notifications

/support → /support/tickets → /support/faq → /support/about → /support/privacy → /support/terms
```

### 8.4 State Management Strategy

| State Type | Approach | Tools |
|-----------|----------|-------|
| Server data | Riverpod FutureProvider/StreamProvider | Auto-refresh + Drift cache |
| UI state | StateNotifierProvider (Riverpod) | Form, selection, pagination |
| Global app | ChangeNotifier (Provider) | User, tenant, branch, connectivity |
| Offline queue | Drift DAO | Sync engine processes queue |
| Real-time | Socket.IO stream → StateNotifier | Live order/table/kitchen updates |

---

## 9. Backend Planning

### 9.1 Per-Module Structure

```
modules/{name}/
├── dto/
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── query-{entity}.dto.ts
├── {name}.controller.ts         # REST endpoints
├── {name}.service.ts            # Business logic
├── {name}.module.ts             # NestJS module definition
├── {name}.gateway.ts            # WebSocket events (if real-time)
├── {name}.processor.ts          # BullMQ queue processor (if async)
├── {name}.spec.ts               # Unit tests
└── {name}.integration-spec.ts   # Integration tests
```

### 9.2 Controller Pattern

```typescript
@Controller('orders')
@UseGuards(AuthGuard)
@ApiTags('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Permissions('orders:read')
  @ApiOperation({ summary: 'List orders' })
  async findAll(@Query() query: PaginationDto) {
    return this.ordersService.findAll(query);
  }

  @Post()
  @Permissions('orders:create')
  @ApiOperation({ summary: 'Create order' })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Patch(':id/status')
  @Permissions('orders:update-status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
```

### 9.3 Service Pattern

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private notificationService: NotificationService,
    private gateway: EventsGateway,
  ) {}

  async create(dto: CreateOrderDto, ctx: RequestContext): Promise<Order> {
    // 1. Validate items (menu available, pricing correct)
    // 2. Create order in DB (tenant-isolated)
    // 3. Deduct inventory (async via event)
    // 4. Send KOT to kitchen (WebSocket event)
    // 5. Notify waiters (if dine-in) or delivery team
    // 6. Return order with items
  }
}
```

### 9.4 Queue Processors (BullMQ)

| Queue | Purpose | Processor |
|-------|---------|-----------|
| `notifications` | Send push/email/SMS/WhatsApp | NotificationProcessor |
| `inventory` | Stock deductions, low-stock alerts | InventoryProcessor |
| `reports` | Generate and cache reports | ReportProcessor |
| `subscriptions` | Renewals, grace period handling | SubscriptionProcessor |
| `sync` | Process offline sync batches | SyncProcessor |
| `ai` | Generate AI insights | AIProcessor |
| `invoices` | Generate invoice PDFs | InvoiceProcessor |
| `backups` | Automated DB backups | BackupProcessor |

### 9.5 Cron Jobs (@nestjs/schedule)

| Cron | Schedule | Purpose |
|------|----------|---------|
| Daily sales digest | `0 23 * * *` | Generate + email daily report |
| Subscription expiry | `0 0 * * *` | Process grace period/restrict |
| Low stock alerts | `*/30 * * * *` | Check thresholds per tenant |
| Sync queue cleanup | `0 3 * * *` | Remove old/processed records |
| Database backup | `0 4 * * *` | PostgreSQL dump to S3 |
| Token cleanup | `0 5 * * *` | Remove expired refresh tokens |

---

## 10. Real-Time Planning

### 10.1 Update Latency Targets

| Update Type | Channel | Latency Target |
|-------------|---------|----------------|
| New order → Kitchen | WebSocket | < 500ms |
| Order status → Waiters | WebSocket | < 500ms |
| Table status → Floor view | WebSocket | < 1s |
| Payment → Receipt | WebSocket | < 1s |
| KOT → Kitchen display | WebSocket | < 1s |
| Food ready → Waiter | WebSocket + Push | < 1s |
| Low stock → Manager | WebSocket + Push | < 5s |
| New reservation → Reception | WebSocket | < 1s |
| Delivery GPS → Customer | WebSocket (public) | < 2s |
| Staff clock-in → Manager | WebSocket | < 2s |
| Notification → User | WebSocket + FCM | < 3s |
| Sync conflict → App | WebSocket | < 2s |
| Analytics refresh | WebSocket | < 5s |

### 10.2 Recipient Mapping

| Event | Recipients | Room |
|-------|------------|------|
| `order:created` | Branch staff | `branch:{id}` |
| `order:status-changed` | Branch + order waiter | `branch:{id}`, `user:{waiterId}` |
| `kitchen:ready` | Assigned waiter | `user:{waiterId}` |
| `table:status-changed` | Reception + waiters | `branch:{id}` |
| `table:bill-requested` | Cashiers | `role:cashier` |
| `payment:completed` | Cashiers + owner | `branch:{id}` |
| `inventory:low-stock` | Inventory manager | `role:inventory-manager` |
| `delivery:gps-update` | Customer | `order:{id}` (public) |
| `reservation:arrived` | Reception | `branch:{id}` |

### 10.3 Offline Sync Strategy

**Data Classification:**

| Category | Examples | Offline Behavior |
|----------|----------|------------------|
| **Reference** | Menu, categories, staff, tables | Fully cached in Drift, synced on change |
| **Transactional** | Orders, payments, KOTs | Created locally, queued, pushed when online |
| **Volatile** | Table status, inventory qty | Optimistic UI, synced on reconnect |
| **Media** | Images, documents | Cached with lazy loading |

**Sync Algorithm:**

1. App start → `GET /sync/pull?since={lastSyncTimestamp}` → populate Drift with server state
2. User action → write to Drift + enqueue in `sync_outbox` table
3. Background sync engine (triggered by `connectivity_plus`):
   - Read up to 50 queued items
   - POST `/sync/push` with batch `{mutations: [{id, entity, action, payload, version, timestamp}]}`
   - On 200 → mark synced, remove from queue
   - On 409 (conflict) → server returns current version, client re-fetches
   - On network error → increment retry, exponential backoff (1s, 2s, 4s, 8s... max 5 min)
4. Server emits `sync:completed` via WebSocket to notify other clients
5. Other clients receive fresh data via WebSocket or next pull

**Conflict Resolution:** "Last-Write-Wins" with server authority. Server timestamp is authoritative. On conflict, server returns current version; client re-applies user's change if still semantically valid.

---

## 11. UI/UX Planning

### 11.1 Design System

Already defined in [DESIGN.md](./DESIGN.md) (561 lines):

- **Colors:** Warm cream neutrals (`#FFF9F5` bg), Crimson accent (`#E23744`), Emerald success (`#2DB67D`)
- **Typography:** Inter font family, responsive scale (72px H1 → 14px caption)
- **Dark Mode:** Full token overrides (`#0D0D0D` bg, `#F5F5F5` text)
- **Component Library:** 25+ reusable NxWidgets documented
- **Spacing:** 4px base grid, 8/16/24/32/48/64 increments

### 11.2 Navigation Architecture

**Mobile** (`BottomNavigationBar`):
```
[🏠 Dashboard] [📋 Orders] [🍽 Menu] [💳 POS] [⚙️ More]
```

**Desktop** (`NavigationDrawer`):
```
🏠 Dashboard     ├── Executive Dashboard
📋 Orders        ├── Live Orders
🪑 Tables        ├── Floor Layout
🧾 Menu          ├── Categories
🔪 Kitchen       ├── KDS
📦 Inventory     ├── Stock
👥 CRM           ├── Customers
🚚 Delivery      ├── Partners
📅 Reservations  ├── Calendar
👨‍🍳 Staff         ├── Employees
💰 Finance       ├── Income
📊 Reports       ├── Daily
🤖 AI            ├── Insights
🎨 Website       ├── CMS
📣 Marketing     ├── Campaigns
💳 Subscription  ├── Plan
🔧 Settings      ├── Profile
🆘 Support       ├── Tickets
```

### 11.3 Component Library (25+ Shared Widgets)

| Component | Purpose |
|-----------|---------|
| `NxAppBar` | Standard app bar with title, actions, back |
| `NxCard` | Elevated card with optional header/footer |
| `NxButton` | Primary/secondary/outline/text variants |
| `NxTextField` | Form input with validation states |
| `NxDropdown` | Searchable dropdown |
| `NxTable` | Data table with sort, filter, pagination |
| `NxChart` | Chart wrapper (fl_chart) — line, bar, pie |
| `NxBadge` | Status badge (color-coded) |
| `NxStatusChip` | Order/table status indicator |
| `NxLoadingShimmer` | Skeleton loading placeholder |
| `NxEmptyState` | Empty list with illustration |
| `NxErrorState` | Error state with retry |
| `NxConfirmDialog` | Confirmation dialog |
| `NxBottomSheet` | Draggable bottom sheet |
| `NxFab` | FAB for primary actions |
| `NxSearchBar` | Search with autocomplete |
| `NxKpiTile` | Dashboard KPI card |
| `NxPermissionGate` | RBAC + subscription gate |
| `NxSyncIndicator` | Sync status indicator |
| `NxConnectivityBanner` | Offline warning |
| `NxBarcodeScanner` | Camera barcode scanner |
| `NxSignaturePad` | Signature input for receipts |
| `NxImagePicker` | Camera/gallery image selector |
| `NxDateRangePicker` | Date range selector |

---

## 12. Security Planning

### 12.1 JWT Strategy

| Token | Type | Payload | Expiry | Storage |
|-------|------|---------|--------|---------|
| Access | JWT (HS256) | `sub, tenantId, branchId, roleId, permissions[]` | 15 min | Memory (Flutter) / HTTP-only cookie (Web) |
| Refresh | Opaque UUID (SHA-256 in DB) | None | 30 days | `flutter_secure_storage` / HTTP-only cookie |
| Admin | JWT (HS256) | `sub, role:super_admin` | 15 min | HTTP-only cookie |

### 12.2 Headers & Middleware (Configured in main.ts)

- `helmet()` with CSP in production
- CORS whitelist from `CORS_ORIGIN` env
- `cookie-parser` with secure flags
- Rate limiting: 100 req/min general, 5 req/min login, 30 req/min public
- CSRF middleware on state-changing endpoints

### 12.3 Encryption

| Data | Encryption |
|------|------------|
| Passwords | bcryptjs (12 salt rounds) |
| Refresh tokens | SHA-256 hashed in DB |
| JWT secret | Environment variable (min 64 chars) |
| File uploads | S3 server-side encryption (AES-256) |
| API keys in DB | AES-256-GCM with key rotation |
| TLS | All traffic HTTPS in production (terminated at reverse proxy) |

### 12.4 OWASP Top 10 Mitigations

| Risk | Mitigation |
|------|------------|
| **Broken Access Control** | RBAC + PermissionGuard + Tenant isolation middleware |
| **Cryptographic Failures** | bcrypt, SHA-256, TLS 1.3, secure random |
| **Injection** | Prisma parameterized queries, class-validator whitelist |
| **Insecure Design** | Input validation, rate limiting, event-driven architecture |
| **Security Misconfiguration** | Helmet, env validation on bootstrap, strict CORS |
| **Vulnerable Components** | Dependabot, `pnpm audit` in CI, lockfile |
| **Authentication Failures** | 15-min JWT, refresh rotation, MFA/TOTP, biometric |
| **Integrity Failures** | Version-based optimistic concurrency, audit logs |
| **Logging Failures** | CorrelationIdInterceptor, structured JSON logs, AuditLog model |
| **SSRF** | URL validation, Prisma abstraction avoids raw DB connectors |

### 12.5 Audit Logging

Every critical mutation is recorded in the `AuditLog` model:

```typescript
{
  tenantId, userId, action: "ORDER.CREATE",
  entity: "Order", entityId: "ord_123",
  oldValue: null, newValue: { ... },
  ipAddress, userAgent, correlationId
}
```

### 12.6 Rate Limiting

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| General API | 100 req | 1 min per IP |
| Auth (login) | 5 req | 1 min per IP |
| Public (menu) | 30 req | 1 min per IP |
| Sync push | 20 req | 1 min per tenant |
| WebSocket connect | 10 | 1 min per IP |

---

## 13. DevOps Planning

### 13.1 Docker Stack

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: nexaros
      POSTGRES_USER: nexaros
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine

  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    depends_on: [postgres, redis]
    ports: ["4000:4000"]

  marketing-web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.marketing
    ports: ["3002:3002"]

  customer-web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.customer
    ports: ["3001:3001"]

  admin-portal:
    build:
      context: ..
      dockerfile: docker/Dockerfile.admin
    ports: ["3003:3003"]
```

### 13.2 CI/CD Pipeline

**CI (on push/PR to main):**
1. `pnpm install --frozen-lockfile`
2. `pnpm lint` (eslint across all workspaces)
3. `pnpm test` (jest backend unit tests)
4. `pnpm --filter @nexaros/backend build`
5. `prisma generate && prisma migrate deploy` (migration check)
6. `pnpm --filter nexaros_app analyze` (Flutter analyze)
7. `pnpm --filter nexaros_app test` (Flutter tests)

**CD (on merge to main):**
- Backend → Deploy to Railway (Docker)
- Marketing Web → Deploy to Vercel
- Customer Web → Deploy to Vercel
- Admin Portal → Deploy to Vercel

### 13.3 Environment Variables

```
# Backend (apps/backend/.env)
DATABASE_URL=postgresql://nexaros:${DB_PASSWORD}@localhost:5433/nexaros
REDIS_URL=redis://localhost:6379
JWT_SECRET=<64-char-random>
JWT_REFRESH_SECRET=<64-char-random>
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3003
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
FCM_SERVER_KEY=...
RESEND_API_KEY=...
WHATSAPP_API_KEY=...
S3_ENDPOINT=https://s3.region.amazonaws.com
S3_BUCKET=nexaros-uploads
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
NODE_ENV=development
PORT=4000
```

### 13.4 Health Check

```
GET /api/v1/health

Response:
{
  "status": "ok",
  "timestamp": "2026-07-15T12:00:00Z",
  "uptime": 3600,
  "database": { "status": "connected", "latencyMs": 2 },
  "redis": { "status": "connected", "latencyMs": 1 },
  "memory": { "used": 256, "total": 1024, "unit": "MB" }
}
```

---

## 14. Testing Strategy

### 14.1 Test Pyramid

```
         ╱╲
        ╱  ╲          E2E Tests: 10 critical flows
       ╱    ╲
      ╱────────╲
     ╱          ╲     Integration Tests: 50+ module-level
    ╱            ╲
   ╱────────────────╲
  ╱                  ╲  Unit Tests: 300+ (services, guards, DTOs)
 ╱                    ╲
╱────────────────────────╲
                          Widget Tests: 200+ (screens, components)
```

### 14.2 Current Status (MVP)

| Test Type | Count | Status |
|-----------|-------|--------|
| Backend unit (spec files) | 25 files | ✅ |
| Backend individual tests | 302 cases | ✅ |
| Flutter widget tests | 1 file (receipt_formatter_test.dart) | Partial |

### 14.3 Backend Testing

- **Framework:** Jest + ts-jest + `@nestjs/testing`
- **Coverage target:** ≥ 80% for services, ≥ 90% for guards/DTOs
- **Mocking:** PrismaService mocked, external services mocked
- **Integration:** Testcontainers PostgreSQL for real DB testing

### 14.4 Flutter Testing

- **Framework:** `flutter_test`
- **Widget tests:** PumpWidget with mock providers
- **Integration:** `integration_test` package for full flows
- **Golden tests:** For critical screens (POS, KDS, Dashboard)

### 14.5 E2E Flows to Cover

1. Restaurant owner registration → login → create menu → place order
2. Cashier POS flow: create bill → apply discount → split payment → print receipt → process refund
3. Kitchen flow: view KDS → start preparing → mark ready → mark completed
4. Inventory flow: create purchase order → receive goods → adjust stock → view low-stock alerts
5. Delivery flow: assign partner → track GPS → mark delivered
6. Reservation flow: create booking → guest arrives → seat at table
7. CRM flow: view customer → award loyalty points → customer redeems
8. Subscription flow: sign up trial → upgrade plan → view billing history
9. Offline flow: go offline → create order → come online → sync
10. Multi-branch flow: switch branches → verify data isolation

### 14.6 Performance & Load

| Scope | Tool | Criteria |
|-------|------|----------|
| API Load | k6 | 100 concurrent users, P95 < 500ms |
| WebSocket | k6 | 500 simultaneous connections |
| Sync | Custom | 1000 batch mutations < 10s |
| Database | pgbench | 1000 TPS with proper indexes |

### 14.7 Security Testing

- `pnpm audit` in CI pipeline
- OWASP ZAP scan on staging
- Manual pen-test for tenant isolation (Tenant A cannot access Tenant B data)
- JWT attack vectors (expired tokens, tampered payload)

---

## 15. Development Roadmap

### Phase 1: Foundation & Core Operations ✅ (MVP COMPLETE)

**Goal:** Restaurant can register, log in, manage menu, take orders, process payments, and run kitchen.

**Modules:** 1-9 (Auth, Home, Exec Dashboard, Orders, Tables, POS, Menu, KDS, Inventory)

**Backend (complete):**
- [x] NestJS scaffold with Prisma, Redis, WebSocket
- [x] Multi-tenant architecture (RequestContext + Prisma middleware)
- [x] Auth module (JWT + refresh tokens + profile)
- [x] RBAC (Roles, Permissions, Guards — 56 permissions)
- [x] Menu CRUD (categories, items, variants, add-ons, images)
- [x] Order lifecycle (create, items, status, cancel, KOT)
- [x] Table management (CRUD, floor plan, status)
- [x] Payment processing (6 methods + refund)
- [x] Inventory (items, movements, low-stock alerts, adjustments)
- [x] Kitchen display (queue, status transitions, KOT)
- [x] Invoice generation (GST, PDF)
- [x] Staff management (profiles, clock-in/out)
- [x] Suppliers & purchases
- [x] Reservations CRUD
- [x] Offline sync (push/pull endpoints)
- [x] Printer support
- [x] Reports (daily sales, items, categories, payments, revenue, hourly, peak hours)
- [x] Notifications (FCM infrastructure)
- [x] AI module scaffold

**Frontend (complete):**
- [x] Splash → Login → Restaurant/Branch selection → Dashboard
- [x] Menu management (categories, items, forms)
- [x] Order list + detail + timeline + history
- [x] Table grid with color-coded status + floor layout
- [x] POS with cart, checkout, discounts, split bill, payments, receipt
- [x] Kitchen display (KDS) with queue, preparing, ready, completed
- [x] Inventory management (items, adjustments, purchase orders, suppliers)
- [x] Reports screen with fl_chart (daily, items, categories, payments)
- [x] CRM (customers list, loyalty, reviews)
- [x] Delivery (dashboard, partners, assignment, tracking, history)
- [x] Reservations (calendar, walk-ins, waiting list)
- [x] Staff (employees, attendance, shifts)
- [x] Finance (dashboard, income, expenses, transactions, tax, invoices, reports)
- [x] Analytics (sales, customer, inventory, staff, kitchen, delivery)
- [x] Subscriptions (current plan, coupon redemption)
- [x] Settings (profile, printers, diagnostics)
- [x] Offline-first with Drift sync engine
- [x] Mobile/Tablet/Desktop shells
- [x] Permission gates (RequirePermission, PermissionGate)
- [x] Subscription entitlement overlay
- [x] Connectivity banner + sync status bar

**Database:**
- [x] Prisma schema (61 models, 27 enums, 1630 lines)
- [x] 6 migration files
- [x] Seed script with plans, roles, permissions, admin

**Infrastructure:**
- [x] Docker Compose (PostgreSQL, Redis)
- [x] CI pipeline (GitHub Actions)
- [x] Railway deployment config
- [x] Env validation on bootstrap

### Phase 2: CRM, Staff, Reservations, Delivery, Finance, Analytics

**Goal:** Complete customer lifecycle, HR tools, table booking, delivery tracking, financial management, analytics.

**Modules:** 10-15 (CRM, Delivery, Reservations, Staff, Finance, Analytics)

**Frontend Screens to Build:**
- [ ] Customer profile screen (order history, favorite dishes, notes)
- [ ] Loyalty program configuration (points/rupee, tiers, rewards)
- [ ] Wallet transactions history
- [ ] Reviews & feedback management
- [ ] Delivery route optimization view
- [ ] Reservation monthly calendar view
- [ ] Reservation detail with guest management
- [ ] Staff dashboard (KPIs: attendance %, active shifts, pending leave)
- [ ] Employee profile (documents, performance, training)
- [ ] Leave request/approval flow
- [ ] Payroll summary with deductions
- [ ] Roles & permissions management UI (drag-drop permission assignment)
- [ ] Shift schedule drag-drop calendar
- [ ] Tax/GST filing preview
- [ ] Invoice PDF preview in-app

**Backend:**
- [ ] Expand CRM endpoints (customer search, loyalty calculation)
- [ ] Delivery route optimization
- [ ] Reservation conflict detection
- [ ] Leave approval workflow
- [ ] Payroll calculation engine
- [ ] Tax/GST aggregation queries
- [ ] Analytics aggregation (sales trends, customer segments)

**Complexity:** High (15 modules, 40+ screens)

### Phase 3: Website Manager, Marketing, Reports Export

**Goal:** Restaurant manages public website, creates marketing campaigns, exports reports.

**Modules:** 16-18 (Website CMS, Marketing, Reports)

**Frontend:**
- [ ] Website dashboard with visitor stats
- [ ] Homepage editor (banners, hero, featured sections)
- [ ] Menu website layout editor
- [ ] Gallery manager (upload, caption, reorder)
- [ ] Contact info editor
- [ ] Theme/branding customizer (colors, fonts, logo upload)
- [ ] SEO settings (meta title, description, OG image, sitemap)
- [ ] Live preview (desktop/tablet/mobile toggle)
- [ ] Publish with revision history
- [ ] Campaign list + create wizard
- [ ] Push notification composer with preview
- [ ] WhatsApp message template editor
- [ ] Email template editor (drag-drop)
- [ ] SMS campaign composer
- [ ] Referral program settings
- [ ] Report detail screens with export (PDF, Excel, CSV)

**Backend:**
- [ ] CMS CRUD (sections, pages, templates)
- [ ] Media upload + S3 storage
- [ ] SEO metadata management
- [ ] Publish workflow (draft → preview → live)
- [ ] Campaign engine (schedule, segment, send)
- [ ] WhatsApp Business API integration
- [ ] Email provider integration (Resend)
- [ ] SMS gateway integration
- [ ] Report generation with dynamic exports

**Complexity:** Medium-High

### Phase 4: SaaS Subscription, Support, Franchise

**Goal:** Full SaaS billing lifecycle, support system, franchise network management.

**Modules:** 19-20, 25, 36 (Subscription, System/Support, Franchise)

**Frontend:**
- [ ] Current plan screen with feature comparison
- [ ] Upgrade plan flow (compare → select → pay)
- [ ] Billing history with invoice download
- [ ] Payment methods management
- [ ] Usage & limits dashboard (branches used, staff count, storage)
- [ ] Help center with search
- [ ] Support ticket list + create + conversation view
- [ ] FAQ categorized view
- [ ] About NexaROS (version, changelog)
- [ ] Privacy policy and terms of service screens
- [ ] Franchise dashboard (head office view)
- [ ] Franchise partner management
- [ ] Royalty calculation & invoicing
- [ ] Brand compliance audit

**Backend:**
- [ ] Subscription lifecycle (trial → active → grace → restricted)
- [ ] Plan entitlement engine (feature flags per plan)
- [ ] Coupon engine (percentage, flat, BOGO, conditions)
- [ ] Razorpay subscription integration
- [ ] Payment promise with grace period
- [ ] Support ticket system (conversation threads, internal notes)
- [ ] Franchise partner CRUD
- [ ] Royalty calculation engine
- [ ] Brand compliance scoring

**Complexity:** High

### Phase 5: AI, Automation, Workflow Builder

**Goal:** AI insights, forecasting, no-code workflow automation.

**Modules:** 22, 31, 35 (AI, Automation, Workflow Builder)

**Frontend:**
- [ ] AI Dashboard with insight cards
- [ ] Sales forecast chart with confidence bands
- [ ] Demand prediction per time slot
- [ ] Inventory forecast with purchase suggestions
- [ ] AI chat assistant (natural language Q&A)
- [ ] Menu recommendation suggestions
- [ ] Customer churn prediction
- [ ] Recipe cost optimization suggestions
- [ ] Promotion suggestions based on trends
- [ ] Alert center (all critical AI alerts)
- [ ] Workflow builder (visual drag-drop: trigger → condition → action)
- [ ] Workflow templates library
- [ ] Approval workflow designer (multi-level)
- [ ] Workflow history + execution logs
- [ ] Workflow enable/disable toggle

**Backend:**
- [ ] AI insight generation engine (aggregation + pattern detection)
- [ ] Sales/demand/inventory forecasting (time series models)
- [ ] Customer behavior analysis (RFM segmentation)
- [ ] Recipe cost optimizer
- [ ] AI chat (OpenAI / Gemini API integration)
- [ ] Workflow execution engine (event → condition chain → actions)
- [ ] Approval chain processor
- [ ] Scheduled workflow triggers

**Complexity:** Very High (AI integration, ML models)

### Phase 6: Enterprise, BI, White Label, Disaster Recovery, Training

**Goal:** Enterprise features, partner program, business intelligence, DR, LMS.

**Modules:** 37-41 (BI, Enterprise, White Label, DR, Training)

**Frontend:**
- [ ] Executive BI dashboard (YoY trends, KPI scorecards)
- [ ] Trend analysis (month-over-month, year-over-year)
- [ ] KPI dashboard with targets vs actual
- [ ] Predictive reports (next quarter forecast)
- [ ] Decision recommendations with business impact
- [ ] Enterprise HQ dashboard (all branches)
- [ ] Regional performance comparison
- [ ] Branch benchmarking table
- [ ] Resource allocation view (stock transfer suggestions)
- [ ] Organization-wide policy editor
- [ ] White label branding customizer (logo, colors, domain, email)
- [ ] Partner dashboard + customer management
- [ ] Revenue sharing reports
- [ ] Business continuity dashboard
- [ ] Backup/restore center (manual restore, schedule config)
- [ ] Offline sync status per device
- [ ] Training course player (video + materials)
- [ ] Assessment engine (quiz with scoring)
- [ ] Certificate viewer

**Backend:**
- [ ] Data warehouse aggregation queries
- [ ] Trend analysis (SQL window functions)
- [ ] KPI calculation engine
- [ ] Predictive models (ML or statistical)
- [ ] Resource allocation optimizer
- [ ] Policy engine (auto-apply rules to branches)
- [ ] White label tenant provisioning
- [ ] Partner revenue splitting
- [ ] Backup management (pg_dump + S3 lifecycle)
- [ ] Recovery orchestration
- [ ] Training CRUD (courses, lessons, videos)
- [ ] Assessment engine (auto-grading)
- [ ] Certificate generation (PDF)

**Complexity:** Very High (enterprise-grade)

---

## 16. Milestones

| Milestone | Phase | Target | Key Deliverables |
|-----------|-------|--------|------------------|
| **M1: MVP Launch** | P1 | ✅ Complete | 9 core modules, 26 screens, 107+ API endpoints, offline sync, 3 responsive shells, RBAC, multi-tenant |
| **M2: CRM + Staff + Finance** | P2 | Month 1-2 | Complete CRM (loyalty, wallet), delivery GPS, reservation calendar, staff management (attendance, shifts, leave, payroll), finance dashboard, tax, analytics suite |
| **M3: Website + Marketing** | P3 | Month 2-3 | Full CMS (editor, gallery, theme, SEO, publish), marketing campaigns (push, WhatsApp, email, SMS), report export (PDF, Excel, CSV) |
| **M4: SaaS Billing + Support** | P4 | Month 3-4 | Subscription lifecycle (trial/active/grace/restricted), payment promises, support ticket system, franchise management, coupon engine |
| **M5: AI + Automation** | P5 | Month 4-6 | AI insights, sales/inventory forecasting, AI chat assistant, workflow builder (visual drag-drop), approval workflows, automation templates |
| **M6: Enterprise Ready** | P6 | Month 6-8 | BI dashboard, trend analysis, white label branding, partner program, disaster recovery (backup/restore), training LMS, enterprise HQ |
| **M7: Production GA** | All | Month 8-10 | Load test passed, security audit clean, full documentation, production deployment, monitoring live |

---

## 17. Risks & Mitigations

| # | Risk | Category | Impact | Likelihood | Mitigation |
|---|------|----------|--------|------------|------------|
| 1 | Offline sync conflicts corrupt data | Technical | Critical | Medium | Version-based OCC, server-authoritative LWW, conflict UI notification |
| 2 | WebSocket scaling at 10K+ concurrent | Performance | High | Medium | Redis adapter for Socket.IO, horizontal pod scaling, connection pooling |
| 3 | Tenant data leakage | Security | Critical | Low | Middleware-enforced tenantId, Prisma middleware, penetration test |
| 4 | PostgreSQL query degradation | Performance | High | Medium | Proper indexes (defined), query optimization, read replicas, connection pooling |
| 5 | Flutter Web performance for POS | Performance | Medium | Medium | Desktop app recommended for POS, limit Web to menu/customer-facing |
| 6 | Payment gateway failures | Technical | High | Low | Idempotency keys, payment promises with retry, grace period |
| 7 | Mobile app size too large for download | UX | Medium | Low | Code splitting, deferred loading, asset optimization, app bundle |
| 8 | i18n complexity with RTL languages | UX | Medium | Low | Flutter intl from day one, separate RTL testing, UI audit |
| 9 | Solo developer bottleneck | Technical | Critical | High | AGENT.md for AI assistance, clear module boundaries, automated testing, comprehensive docs |
| 10 | Subscription billing failures | Business | High | Medium | Grace period (7 days), payment promises, retry logic, manual override |
| 11 | Third-party API rate limits (WhatsApp, Email) | Technical | Medium | Medium | Queue-based sending, rate limit awareness, fallback channels (SMS) |
| 12 | Flutter package compatibility issues | Technical | Medium | Medium | Lock pubspec versions, test upgrades in CI, pin major versions |
| 13 | Multi-branch data consistency in offline mode | Technical | High | Medium | Branch-scoped sync, conflict detection per branch, server authority |

---

## 18. Documentation

### 18.1 Existing Documents (115+ files)

**Platform Documentation** (59 files):
`01_PROJECT_OVERVIEW` through `59_GLOSSARY` covering:
- Product vision, business model, architecture, tech stack
- Folder structure, modules, features, screen flows
- User flows, business flows, E2E flows
- UI/UX guidelines, design system, component library, theme
- Navigation, state management, forms
- API docs, database, caching, offline support
- Auth, authorization, permission matrix
- WebSocket events, notification system
- Analytics, reports, performance
- Security, accessibility, SEO
- Localization, configuration, environment
- Deployment, Docker, monitoring, logging
- Error handling, validations, file storage, media
- Testing, QA checklist, release process
- Backup, recovery, troubleshooting
- Known limitations, tech debt, roadmap, changelog, glossary

**Audit Reports** (8 files):
- Architecture audit
- Database audit
- API audit
- Security audit
- Performance audit
- UI/UX audit
- Codebase audit
- Production-readiness audit

**App Documentation:**
- Per-app READMEs (marketing-web, customer-web, flutter-app, admin-portal, backend)

**Key References:**
- `docs/ARCHITECTURE.md` — System architecture
- `docs/DATABASE.md` — Database reference (49 models documented)
- `docs/API.md` — API endpoint reference (107+ endpoints)
- `docs/INDEX.md` — Complete documentation index with statistics
- `AGENT.md` — AI agent configuration (434 lines)
- `DESIGN.md` — Design system (561 lines)
- `DEPLOY.md` — Deployment guide

### 18.2 Documents Still Needed

| Document | Purpose | Priority |
|----------|---------|----------|
| `Phase-2-Implementation.md` | Sprint breakdown for P2-P6 | High |
| `Test-Cases.md` | Complete test case catalog per module | High |
| `Data-Migration-Plan.md` | Strategy for schema changes across 61 models | Medium |
| `Load-Test-Plan.md` | k6 scenarios and success criteria | Medium |
| `Security-Incident-Response.md` | Process for handling security incidents | Medium |
| `API-Change-Log.md` | Breaking changes tracking | Medium |
| `User-Manual.md` | End-user guide for restaurant staff | Low |

---

## 19. Definition of Done

### 19.1 Per Phase

A phase is **complete** when ALL of the following are true:

1. **Code Complete:** All planned screens, controllers, services, database migrations implemented
2. **Tests Pass:** Unit tests pass (coverage ≥ 80% for critical paths), integration tests pass
3. **Lint Clean:** `pnpm lint` produces zero errors, zero warnings
4. **API Docs Updated:** Swagger decorators present on all new endpoints
5. **Offline Verified:** All critical flows work in airplane mode and sync correctly
6. **RBAC Enforced:** Every endpoint and screen is gated by appropriate permissions
7. **WebSocket Tested:** Real-time events fire and are received by all intended clients
8. **Responsive Verified:** App renders correctly on Mobile (<600px), Tablet (600-1024px), Desktop (>1024px)
9. **Database Migration Clean:** `prisma migrate dev` produces no errors, rollback tested
10. **No Regression:** All existing Phase 1 flows still pass (smoke test)
11. **Documentation Updated:** README, AGENT.md, relevant platform docs updated
12. **PR Reviewed:** Code review completed (human or AI)
13. **CI Green:** All GitHub Actions checks pass

### 19.2 Per Module

A module is **complete** when:

- [ ] All screens render with mock data
- [ ] All API controllers respond correctly with proper status codes
- [ ] All WebSocket events (if applicable) fire and are received
- [ ] Offline cache → sync → pull cycle works for all CRUD operations
- [ ] Permission gates are in place (both backend guards and frontend PermissionGate)
- [ ] Subscription entitlement checked (if applicable)
- [ ] Unit tests for service layer pass (≥ 80% coverage)
- [ ] Widget tests for key screens pass
- [ ] Module integrated into app.module.ts with no import errors
- [ ] Module added to appropriate shell navigation

### 19.3 Per Screen

A screen is **complete** when:

- [ ] UI matches design system (colors, typography, spacing)
- [ ] Data loads from API or local cache
- [ ] Loading, empty, and error states handled
- [ ] Form validation works (if applicable)
- [ ] Responsive: renders correctly on assigned shell (mobile/tablet/desktop)
- [ ] Permission gate applied (if restricted access)
- [ ] Offline: reads from local cache when offline
- [ ] Real-time updates received via WebSocket (if applicable)
- [ ] Keyboard shortcuts work (desktop only, if applicable)
- [ ] Localized strings used (no hardcoded text)

---

*This document is the authoritative implementation blueprint for the NexaROS platform. Every developer should read the relevant section before starting work on any module. The plan follows the project's current status (MVP Complete at Phase 1) and provides detailed specifications for Phases 2-6 to reach enterprise production readiness.*
