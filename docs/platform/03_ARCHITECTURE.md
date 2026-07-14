# System Architecture

## Overview

NexaROS is a multi-product, multi-tenant SaaS platform for restaurants.

## Products

| Product | URL | Purpose |
|---------|-----|---------|
| Marketing Website | nexaros.com | Lead generation |
| Flutter App | app.nexaros.com | Restaurant operations |
| Admin Portal | admin.nexaros.com | Platform management |
| Customer Web | app.nexaros.com | Online ordering |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CDN (Cloudflare)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐   ┌────────▼────────┐   ┌───────▼───────┐
│   Marketing   │   │   Customer Web  │   │  Admin Portal │
│   (Next.js)   │   │   (Next.js)     │   │  (Next.js)    │
│   Port 3002   │   │   Port 3001     │   │  Port 3003    │
└───────┬───────┘   └────────┬────────┘   └───────┬───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API Gateway     │
                    │   (NestJS)        │
                    │   Port 4000       │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐   ┌────────▼────────┐   ┌───────▼───────┐
│  PostgreSQL   │   │     Redis       │   │  Socket.IO    │
│  Port 5433    │   │   Port 6379     │   │  (Real-time)  │
└───────────────┘   └─────────────────┘   └───────────────┘
```

## Tech Stack

### Frontend

- **Marketing**: Next.js 15, Tailwind CSS
- **Customer**: Next.js 15, Tailwind CSS
- **Admin**: Next.js 15, Tailwind CSS
- **Flutter**: Dart, Material 3

### Backend

- **API**: NestJS 10, TypeScript
- **ORM**: Prisma 6.19.x
- **Auth**: JWT, bcrypt
- **Real-time**: Socket.IO
- **Validation**: class-validator

### Database

- **Primary**: PostgreSQL 16
- **Cache**: Redis 7

### Infrastructure

- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana (planned)

## Multi-Tenancy

### Data Isolation

- Every query scoped to `tenantId`
- Branch-level isolation via `BranchScopeGuard`
- Cross-tenant access prevented

### Entitlements

- Plan-based feature access
- 21 module keys
- Runtime validation
- Grace period support

## Offline-First

### Flutter App

- SQLite for local storage
- Hive for settings
- Background sync
- Conflict resolution

### Sync Strategy

- Queue-based operations
- Timestamp-based conflicts
- Periodic background sync
- Immediate sync on reconnect

## Real-Time

### Socket.IO

- Order updates
- Table status
- Kitchen display
- Payment notifications

### Events

- `order:created`
- `order:status-changed`
- `table:status-changed`
- `payment:received`
- `kot:ready`

## Security

### Authentication

- JWT tokens
- bcrypt hashing
- Rate limiting
- CSRF protection

### Authorization

- RBAC (5 permissions)
- Branch scope
- Entitlements guard

### Infrastructure

- Helmet headers
- CORS whitelist
- Input validation
- Audit logging

## Related Documents

- [Modules](08_MODULES.md)
- [Database](22_DATABASE.md)
- [API Documentation](21_API_DOCUMENTATION.md)
