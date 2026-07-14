# Folder Structure

## Monorepo Layout

```
nexaros/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI: lint, build, test for all apps
├── apps/
│   ├── backend/                      # NestJS API Server
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 49 models, 1111 lines
│   │   │   ├── seed.ts              # Seed data (plans, admin)
│   │   │   └── migrations/          # Database migrations
│   │   ├── src/
│   │   │   ├── main.ts              # App bootstrap, Swagger, CORS, Helmet
│   │   │   ├── app.module.ts        # Root module (33 modules)
│   │   │   ├── health.controller.ts # Health check endpoint
│   │   │   ├── modules/             # Feature modules (33)
│   │   │   │   ├── auth/            # JWT auth, registration, login
│   │   │   │   ├── tenants/         # Multi-tenant management
│   │   │   │   ├── branches/        # Branch CRUD + scope guard
│   │   │   │   ├── users/           # User management
│   │   │   │   ├── roles/           # RBAC (56 permissions)
│   │   │   │   ├── menu/            # Categories, items, variants
│   │   │   │   ├── orders/          # Order lifecycle
│   │   │   │   ├── tables/          # Table management
│   │   │   │   ├── kitchen/         # KDS
│   │   │   │   ├── payments/        # 6 payment methods
│   │   │   │   ├── invoices/        # GST invoicing
│   │   │   │   ├── inventory/       # Stock tracking
│   │   │   │   ├── suppliers/       # Supplier management
│   │   │   │   ├── purchases/       # Purchase orders
│   │   │   │   ├── staff/           # Employee management
│   │   │   │   ├── shifts/          # Shift scheduling
│   │   │   │   ├── attendance/      # Clock in/out
│   │   │   │   ├── reservations/    # Table booking
│   │   │   │   ├── reports/         # Analytics
│   │   │   │   ├── billing/         # Subscription lifecycle
│   │   │   │   ├── plans/           # Platform plans
│   │   │   │   ├── entitlements/    # Module access control
│   │   │   │   ├── coupons/         # Coupon engine
│   │   │   │   ├── admin/           # Admin auth + MFA
│   │   │   │   ├── support/         # Ticket system
│   │   │   │   ├── demo-requests/   # Demo pipeline
│   │   │   │   ├── platform/        # Platform settings
│   │   │   │   ├── notifications/   # Push notifications
│   │   │   │   ├── printer/         # ESC/POS integration
│   │   │   │   ├── ai/              # AI analytics (planned)
│   │   │   │   ├── websockets/      # Socket.IO gateway
│   │   │   │   ├── sync/            # Offline sync
│   │   │   │   └── public/          # Public API
│   │   │   └── common/
│   │   │       ├── guards/          # JWT, Branch, Entitlements, Permissions
│   │   │       ├── middleware/       # Rate limit, CSRF, Login rate limit
│   │   │       ├── interceptors/    # Logging
│   │   │       ├── filters/         # Exception filter
│   │   │       ├── decorators/      # CurrentTenant, CurrentUser
│   │   │       ├── providers/       # Payment gateway (stub)
│   │   │       └── dto/             # Shared DTOs
│   │   ├── docker/Dockerfile.backend
│   │   └── package.json
│   │
│   ├── marketing-web/                # Next.js Marketing Website
│   │   ├── src/app/                  # 24 routes
│   │   │   ├── page.tsx             # Landing page (12 sections)
│   │   │   ├── layout.tsx           # Root layout with Navbar/Footer
│   │   │   ├── features/            # Features page
│   │   │   ├── pricing/             # Pricing page
│   │   │   ├── register/            # Restaurant registration
│   │   │   ├── login/               # Login
│   │   │   ├── checkout/            # Subscription checkout
│   │   │   ├── blog/                # Blog listing + [slug]
│   │   │   ├── docs/                # Documentation + [slug]
│   │   │   └── ... (14 more routes)
│   │   ├── src/components/
│   │   │   ├── Navbar.tsx           # Navigation bar
│   │   │   ├── Footer.tsx           # Footer
│   │   │   └── ui.tsx               # Shared UI (Button, Card, Badge, etc.)
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── admin-portal/                 # Next.js Super Admin Portal
│   │   ├── src/app/
│   │   │   ├── login/               # Admin login
│   │   │   └── (dashboard)/         # Protected dashboard
│   │   │       ├── page.tsx         # Overview
│   │   │       ├── restaurants/     # Tenant management
│   │   │       ├── subscriptions/   # Subscription management
│   │   │       ├── billing/         # Billing overview
│   │   │       ├── coupons/         # Coupon management
│   │   │       ├── demo-requests/   # Demo pipeline
│   │   │       ├── support/         # Ticket system
│   │   │       ├── admin-users/     # Admin user management
│   │   │       ├── audit-logs/      # Audit trail
│   │   │       ├── payment-promises/ # Payment promises
│   │   │       └── settings/        # Platform settings
│   │   ├── src/lib/api.ts           # AdminApiClient
│   │   └── next.config.js           # output: 'standalone'
│   │
│   ├── customer-web/                 # Next.js Customer-Facing Pages
│   │   ├── src/app/
│   │   │   ├── page.tsx             # Home/redirect
│   │   │   └── restaurant/[slug]/   # Restaurant page + order + table
│   │   └── package.json
│   │
│   └── flutter-app/                  # Flutter Restaurant App
│       ├── lib/
│       │   ├── main.dart            # Entry point, providers
│       │   ├── app/
│       │   │   ├── app.dart         # MaterialApp, theme, routing
│       │   │   └── shells/          # Mobile, Tablet, Desktop shells
│       │   ├── core/
│       │   │   ├── network/         # ApiClient, SocketService, ConnectivityMonitor
│       │   │   ├── providers/       # AppState, SubscriptionProvider, BranchProvider
│       │   │   ├── database/        # LocalDatabase (Drift ORM)
│       │   │   ├── sync/            # OfflineSyncService, OfflineOrder/Payment
│       │   │   ├── hardware/        # PrinterService (ESC/POS)
│       │   │   ├── theme/           # AppColors, AppTheme
│       │   │   ├── widgets/         # Reusable widgets (11)
│       │   │   └── constants/       # API URLs, etc.
│       │   └── features/
│       │       ├── auth/            # Login
│       │       ├── dashboard/       # Dashboard
│       │       ├── pos/             # Point of Sale
│       │       ├── orders/          # Order management
│       │       ├── menu/            # Menu management
│       │       ├── tables/          # Table grid
│       │       ├── kitchen/         # Kitchen display
│       │       ├── staff/           # Staff, Attendance, Shifts
│       │       ├── inventory/       # Inventory, Suppliers, Purchases
│       │       ├── reservations/    # Table booking
│       │       ├── reports/         # Analytics
│       │       ├── payments/        # Bill + Payment
│       │       ├── subscriptions/   # Subscription + Coupons
│       │       ├── branches/        # Branch management
│       │       ├── settings/        # Printer settings
│       │       └── more/            # Feature grid
│       ├── android/
│       ├── ios/
│       └── pubspec.yaml
│
├── docker/
│   ├── docker-compose.yml           # Full stack: postgres, redis, backend, 3 web apps
│   ├── Dockerfile.backend           # Multi-stage NestJS build
│   ├── Dockerfile.marketing         # Multi-stage Next.js build
│   ├── Dockerfile.customer          # Multi-stage Next.js build
│   └── Dockerfile.admin             # Multi-stage Next.js build
│
├── docs/                            # This documentation
├── AGENT.md                         # AI agent instructions
├── DESIGN.md                        # Design system
├── NexaROS-Complete-Build-Plan.md   # Build plan
├── pnpm-workspace.yaml              # Monorepo config
└── package.json                     # Root package.json
```

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Tech Stack](06_TECH_STACK.md)
- [Modules](08_MODULES.md)
