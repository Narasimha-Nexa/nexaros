# Backend App Documentation

> Detailed source: [apps/backend/](../../apps/backend/)

## Overview

NexaROS backend — NestJS 10 with Prisma 6.19.x, 33 modules, 302 tests.

## Tech Stack

- NestJS 10
- Prisma 6.19.x
- PostgreSQL 16
- Redis
- Socket.IO
- JWT
- Class-validator
- Helmet

## Modules (33)

### Core

- `auth` — Authentication, JWT
- `tenants` — Multi-tenant CRUD
- `branches` — Branch management
- `users` — User profiles
- `roles` — RBAC

### Operations

- `menu` — Categories, items
- `orders` — Order lifecycle
- `tables` — Table management
- `kitchen` — KDS
- `payments` — Payment processing
- `invoices` — GST invoicing

### Back Office

- `inventory` — Stock tracking
- `suppliers` — Supplier CRUD
- `purchases` — Purchase orders
- `staff` — Employee management
- `reservations` — Table booking

### Analytics

- `reports` — Sales, inventory, staff reports
- `ai` — AI analytics (planned)

### Platform

- `billing` — Subscription lifecycle
- `plans` — Platform plans
- `entitlements` — Module access
- `coupons` — Coupon engine
- `subscriptions` — Subscription CRUD

### Infrastructure

- `websockets` — Real-time events
- `sync` — Offline data sync
- `printer` — ESC/POS printing
- `notifications` — Push notifications
- `public` — Public API

### Admin

- `admin` — Admin auth, MFA
- `support` — Ticket system
- `demo-requests` — Demo pipeline
- `platform` — Platform settings

## Guards

- `JwtAuthGuard` — JWT validation
- `AdminJwtAuthGuard` — Admin JWT
- `BranchScopeGuard` — Branch isolation
- `EntitlementsGuard` — Module access
- `PermissionsGuard` — RBAC

## Middleware

- `RateLimitMiddleware` — 100 req/min
- `LoginRateLimitMiddleware` — 5 attempts
- `PublicRateLimitMiddleware` — 30 req/min
- `CsrfMiddleware` — CSRF protection

## Test Coverage

- **25 test suites**
- **302 tests**
- **All passing**

## Docker

```bash
# Build
docker build -f docker/Dockerfile.backend -t nexaros-backend .

# Run
docker run -p 4000:4000 nexaros-backend
```

## Related Documents

- [Backend App](31_BACKEND_APP.md)
- [API Documentation](21_API_DOCUMENTATION.md)
- [Database](22_DATABASE.md)
- [Modules](08_MODULES.md)
