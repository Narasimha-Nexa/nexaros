# AGENT.md — NexaROS Agent Configuration

> This file provides instructions for AI coding agents working on NexaROS.  
> Read this file before making any changes to the codebase.

---

## Project Overview

**NexaROS** is an AI-Powered Restaurant Operating System — a real-time, multi-tenant, offline-first enterprise SaaS platform.

### Platform Architecture: Multiple Products, One Backend

```
                    NexaROS Platform
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
 Marketing Website     Restaurant OS      Super Admin Portal
  (Public)              (Private)          (Private)
   nexaros.com          app.nexaros.com    admin.nexaros.com
        │                  │                  │
        └──────────────Shared Backend─────────┘
                        NestJS APIs
                   PostgreSQL + Redis
```

| Application | Technology | Port | Purpose |
|---|---|---|---|
| Marketing Website | Next.js 15 + Tailwind CSS v4 | 3002 | Public: branding, registration, pricing |
| Customer Website | Next.js 15 + PWA | 3001 | Customer-facing: menu, ordering, reservations |
| Restaurant App | Flutter (Desktop + Mobile + Tablet + TV) | — | Restaurant operations: POS, orders, kitchen, inventory |
| Super Admin Portal | Next.js 15 + Tailwind CSS v4 + Recharts | 3003 | Private enterprise portal for platform management |

### Single Backend

| Layer | Technology |
|---|---|
| API Server | NestJS (TypeScript) |
| Database | PostgreSQL (port 5433) |
| ORM | Prisma 6.19.x |
| Cache | Redis (port 6379) |
| Real-time | Socket.IO |
| Offline DB | SQLite (Drift ORM in Flutter) |
| Auth (Restaurants) | JWT + Refresh Tokens |
| Auth (Admin) | Separate JWT + MFA + RBAC + PBAC |

---

## Architecture Principles

### 1. Offline-First

- The Flutter app MUST work without internet
- All critical data is stored in local SQLite via Drift
- A sync queue uploads changes when connectivity returns
- Kitchen KOTs print even when offline
- Orders are created locally and synced to server when online

### 2. Multi-Tenant

- Every database table MUST include a `tenantId` field
- Data is isolated per restaurant organization
- Branches exist under tenants
- Users belong to tenants
- No cross-tenant data access ever

### 3. API-First

- Nothing accesses PostgreSQL directly except the NestJS backend
- All frontend applications (Next.js, Flutter) consume REST APIs
- Real-time updates use Socket.IO events
- The backend is the single source of truth

### 4. Role-Based Access Control

- Owners create custom roles (Head Waiter, Kitchen Supervisor, etc.)
- Each role maps to specific permissions
- NestJS guards enforce permissions on every endpoint
- Flutter conditionally renders UI based on allowed permissions
- Dashboards auto-generate based on role permissions

### 5. Responsive by Device, Not Screen Size

- Organize code by device type: mobile, tablet, desktop, TV
- Shared business logic across all layouts
- Different layouts per device, same data
- Feature availability varies by device capability

### 6. Marketing Website (Public)

- Public website at nexaros.com
- ONLY creates restaurants (registration)
- Does NOT run restaurants, manage orders, or manage payments
- Customer-facing website (app.nexaros.com) is separate, linked from marketing website
- Registration calls POST /api/auth/register, creates restaurant

### 7. Super Admin Portal (Private)

- Enterprise portal at admin.nexaros.com
- Never referenced from public marketing website
- Platform owner accesses it directly
- Manages subscriptions, billing, coupons, support, restaurants
- Fully separate authentication (admin users, not restaurant users)

### 8. Subscription & Billing System

- Subscription lifecycle: TRIAL → ACTIVE → PAYMENT_PENDING → GRACE_PERIOD → RESTRICTED → SUSPENDED → ARCHIVED
- Entitlement-based access control (module keys, not plan names)
- Restricted mode allows core POS operations even without active subscription
- Payment promises for deferred payments
- Custom plans created by Super Admin per restaurant
- Coupon system for festivals (Pongal, Diwali, Ugadi) and manual discounts
- PlatformPlan stores plan config + entitlements
- Subscription stores entitlement snapshot + custom pricing

### 9. Entitlement System

- 21 module keys: pos, kitchen, orders, tables, inventory, staff, shifts, attendance, payments, invoices, reports, ai_analytics, crm, loyalty, qr_ordering, customer_website, reservations, multi_branch, api_access, white_label, priority_support
- Two restaurants on same plan can have different entitlements
- Flutter screens check entitlements: `if (entitlements.features['module_key'])`
- Backend guards check entitlements: `EntitlementsGuard`
- Never check plan name, always check entitlements

### 10. Restricted Mode

When subscription is RESTRICTED or grace period expired:
- POS, Orders, Kitchen, Tables, Payments, Invoices → ALWAYS WORK
- Everything else requires active subscription
- No data loss, just UI restriction
- Owner sees upgrade prompts

---

## Folder Structure

```
nexaros/
├── apps/
│   ├── marketing-web/       # Next.js marketing site (public, port 3002)
│   ├── customer-web/        # Next.js restaurant website (port 3001)
│   ├── admin-portal/        # Next.js Super Admin Portal (private, port 3003)
│   └── flutter-app/         # Flutter (mobile + desktop + tablet + TV)
├── packages/
│   ├── types/               # Shared TypeScript types
│   ├── ui/                  # Shared UI components (web)
│   ├── config/              # Shared configs (eslint, prettier)
│   └── api-client/          # Generated API client
├── docker/
├── docs/
├── scripts/
└── .github/workflows/
```

---

## Coding Conventions

### Backend (NestJS)

- Use Prisma for all database access
- Every module must have: controller, service, DTO, entity
- Use class-validator for request validation
- Use @UseGuards() for authentication and authorization
- Return consistent response format: `{ data, meta, errors }`
- Use HTTP exceptions with proper status codes
- All endpoints must be tenant-scoped

### Frontend (Next.js)

- Use App Router (not Pages Router)
- Use Server Components by default, Client Components only when needed
- Use Tailwind CSS v4 for styling
- Use shadcn/ui for component library
- Use React Hook Form + Zod for forms
- Use TanStack Query for data fetching
- Use Zustand for client state
- Implement i18n with next-intl

### Mobile/Desktop (Flutter)

- Use feature-first folder structure
- Each feature has: data/, domain/, presentation/ (mobile|tablet|desktop|tv)/
- Use Riverpod for state management
- Use Drift for local SQLite database
- Use responsive_layout.dart to switch between device layouts
- Never hardcode colors, use theme system
- Use i18n for all user-facing strings

### Database

- Use cuid() for all primary keys (never auto-increment integers)
- Always include tenantId on tenant-scoped tables
- Use enums for fixed values (OrderStatus, PaymentMethod, etc.)
- Add @@index on frequently queried fields
- Use @db.Decimal for monetary values

---

## Key Patterns

### Offline Sync Pattern

```dart
// 1. Save locally
await localDatabase.insertOrder(localOrder);

// 2. Add to sync queue
await syncQueue.add(
  entityType: 'Order',
  action: 'create',
  payload: jsonEncode(localOrder.toJson()),
);

// 3. When online, sync processes queue
// Server assigns orderNumber, broadcasts via WebSocket
```

### Permission-Based UI Pattern

```dart
// Fetch user permissions from backend
final permissions = await api.getMyPermissions();

// Conditionally render features
if (permissions.contains('manage_menu')) {
  showMenuEditor();
}

if (permissions.contains('view_reports')) {
  showReportsSection();
}
```

### Multi-Device Layout Pattern

```dart
// shared/dashboard.dart
class DashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ResponsiveLayout(
      mobile: DashboardMobile(),
      tablet: DashboardTablet(),
      desktop: DashboardDesktop(),
      tv: DashboardTV(),
    );
  }
}
```

---

## Device-Specific Features

| Feature | Mobile | Tablet | Desktop | TV |
|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Limited |
| POS | No | Yes | Yes | No |
| Orders | Yes | Yes | Yes | Yes |
| Menu Management | Yes | Yes | Yes | No |
| Kitchen Display | No | No | No | Yes |
| Reports | No | Limited | Yes | No |
| Inventory | Limited | Yes | Yes | No |
| Finance | No | No | Yes | No |
| Staff Management | Yes | Yes | Yes | No |
| Settings | Yes | Yes | Yes | No |
| AI Assistant | Yes | Yes | Yes | Yes |

---

## Hardware Integration

### Printers (ESC/POS)

- Network printers: TCP connection to printer IP (port 9100)
- USB printers: Write to /dev/usb/lp0 or via CUPS
- KOT printing: Separate kitchen printer, triggered on order creation
- Receipt printing: Counter printer, triggered on payment

### Barcode Scanner

- USB HID device (appears as keyboard)
- No special library needed
- Flutter receives text input events
- Parse barcode string and lookup in local SQLite

### Cash Drawer

- Connected via receipt printer (pulse command)
- Triggered automatically on cash payment
- Can also be USB-connected

---

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://nexaros:nexaros_dev@localhost:5433/nexaros
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
ADMIN_JWT_SECRET=your-admin-secret-key  # Separate admin JWT secret
ADMIN_JWT_REFRESH_SECRET=your-admin-refresh-secret
PORT=4000
NODE_ENV=development

# Razorpay (stub until keys arrive)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET_NAME=

# CORS (allow all 3 frontends)
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:3003
```

### Flutter (.env or config)

```
API_BASE_URL=http://10.0.2.2:4000  # Android emulator
# API_BASE_URL=http://localhost:4000  # Desktop
# API_BASE_URL=https://api.nexaros.com  # Production
```

---

## Testing Strategy

### Backend

- Unit tests for services
- Integration tests for controllers
- E2E tests for critical flows (auth, orders, payments)
- Use Jest + Supertest

### Frontend (Next.js)

- Component tests with React Testing Library
- Page tests for critical flows
- Use Jest

### Flutter

- Unit tests for business logic
- Widget tests for UI components
- Integration tests for critical flows
- Use flutter_test

---

## Deployment

### Development

```bash
docker compose up -d    # Start PostgreSQL + Redis
cd apps/backend && pnpm run start:dev   # Start backend
cd apps/marketing-web && pnpm run dev    # Start marketing site
cd apps/customer-web && pnpm run dev     # Start customer site
cd apps/flutter-app && flutter run       # Start Flutter app
```

### Production

- Backend: Railway (Docker)
- Marketing Website: Vercel
- Customer Website: Vercel
- Flutter Desktop: Build .deb package
- Flutter Mobile: Build APK/AAB

---

## Common Commands

```bash
# Database
npx prisma migrate dev        # Create migration
npx prisma generate           # Generate Prisma client
npx prisma studio             # Open database GUI
npx prisma db seed            # Seed database

# Backend
pnpm run start:dev            # Start in development
pnpm run build                # Build for production
pnpm run test                 # Run tests

# Flutter
flutter pub get               # Install dependencies
flutter run                    # Run app
flutter build linux            # Build Linux desktop
flutter build apk              # Build Android APK

# Docker
docker compose up -d           # Start all services
docker compose down            # Stop all services
docker compose logs -f         # View logs
```

---

## Do NOT

- Never hardcode database credentials
- Never skip tenantId checks in queries
- Never expose internal error messages to clients
- Never use integer auto-increment IDs
- Never store passwords in plain text
- Never allow cross-tenant data access
- Never skip input validation
- Never commit .env files
- Never use `print()` for production logging (use logger package)
- Never bypass RBAC guards
- Never mix admin auth with restaurant auth
- Never create fake/seeded payment data — use stub provider
- Never check plan name for access — always check entitlements
- Never block POS/Orders/Kitchen/Payments during subscription issues

---

*This file is the source of truth for agent behavior on the NexaROS project.*
