# Project Overview

> **NexaROS** — AI-Powered Restaurant Operating System

## What is NexaROS?

NexaROS is a multi-product, multi-tenant, enterprise SaaS platform that digitizes and automates restaurant operations. It provides a complete technology stack for restaurants — from point-of-sale to kitchen management, inventory tracking, staff scheduling, analytics, and online ordering.

## Products

| Product | Tech | Port | Audience | Purpose |
|---------|------|------|----------|---------|
| Marketing Website | Next.js 15 | 3002 | Public | Website registration, pricing, docs, blog |
| Customer Web | Next.js 15 | 3001 | Diners | Public restaurant page, menu, QR ordering |
| Flutter App | Flutter 3.32+ | — | Restaurant Staff | POS, Kitchen, Inventory, Staff, Reports |
| Backend API | NestJS 11 | 4000 | All Products | REST API + WebSocket server |
| Super Admin Portal | Next.js 15 | 3003 | Platform Admin | Tenant management, billing, support |

## Architecture Pattern

```
Multi-Product Architecture
├── Shared Backend (NestJS)
├── 3 Separate Frontends (Next.js)
├── 1 Flutter Mobile/Tablet App
├── Single PostgreSQL Database
├── Redis (Sessions, Cache, PubSub)
└── Socket.IO (Real-time Events)
```

## Key Differentiators

1. **Offline-First**: Flutter app works without internet, syncs when connected
2. **Hardware Integration**: Thermal printers, kitchen printers, barcode scanners, cash drawers
3. **Indian Market Focus**: GST invoicing, UPI payments, Indian language support
4. **Multi-Branch**: Branch-scoped data isolation with centralized management
5. **Subscription Lifecycle**: Trial → Active → Grace Period → Restricted → Suspended
6. **Entitlements-Based Access**: Feature access controlled by subscription, not plan names

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend (Web) | Next.js 15, React 19, TypeScript 5.9, Tailwind CSS 4 |
| Frontend (Mobile) | Flutter 3.32+, Dart, Provider, Drift ORM |
| Backend | NestJS 11, TypeScript, Prisma 6.19 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Realtime | Socket.IO 4 |
| Auth | JWT (access + refresh tokens) |
| Payment | Stub (Razorpay-ready interface) |
| Infrastructure | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## Status

| Phase | Status |
|-------|--------|
| Phase 1: Marketing Website | ✅ Complete |
| Phase 2: Billing & Subscriptions | ✅ Complete |
| Phase 3: Super Admin Portal | ✅ Complete |
| Phase 4: Flutter Integration | ✅ Complete |
| Phase 5: Infrastructure & Polish | ✅ Complete |

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Tech Stack](06_TECH_STACK.md)
- [Feature Matrix](09_FEATURES.md)
- [Business Model](03_BUSINESS_MODEL.md)
