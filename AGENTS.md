# AGENTS.md — NexaROS Agent Working Guide

> This file provides instructions for AI coding agents working effectively in the NexaROS repository.  
> Read this file before making any changes to understand the project structure, conventions, and best practices.

## 🔍 Repository Overview

NexaROS is an AI-Powered Restaurant Operating System — a real-time, multi-tenant, offline-first enterprise SaaS platform with four client applications sharing a single NestJS backend.

**Client Applications:**
- **Marketing Website** (`apps/marketing-web`) - Next.js 15, public site (port 3002)
- **Customer Website** (`apps/customer-web`) - Next.js 15, customer-facing (port 3001)  
- **Super Admin Portal** (`apps/admin-portal`) - Next.js 15, enterprise management (port 3003)
- **Restaurant App** (`apps/flutter-app`) - Flutter, cross-platform POS/kitchen system

**Backend:** `apps/backend/` - NestJS with PostgreSQL, Redis, Socket.IO

## 📁 Key Directories to Know

```
/apps
  ├── marketing-web/     # Next.js marketing site
  ├── customer-web/      # Next.js customer portal  
  ├── admin-portal/      # Next.js super admin portal
  ├── backend/           # NestJS API server
  └── flutter-app/       # Flutter restaurant application

/packages
  ├── types/             # Shared TypeScript interfaces
  ├── ui/                # Shared shadcn/ui components
  └── config/            # Shared ESLint/Prettier configs

/docs                    # Comprehensive documentation
/scripts                 # Setup and utility scripts
```

## ⚡ Essential Commands

### Development Setup
```bash
# Install all dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# Start all development servers
pnpm run dev  # Runs all apps in parallel
```

### Individual Services
```bash
# Backend only
cd apps/backend && pnpm run start:dev

# Marketing site only  
cd apps/marketing-web && pnpm run dev

# Customer site only
cd apps/customer-web && pnpm run dev

# Admin portal only
cd apps/admin-portal && pnpm run dev

# Flutter app only
cd apps/flutter-app && flutter run
```

### Database Operations
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create migration
npx prisma migrate dev --name update-schema

# View database GUI
npx prisma studio

# Seed initial data
npx prisma db seed
```

### Testing
```bash
# Backend tests
cd apps/backend && pnpm run test

# Frontend tests (when available)
cd apps/* && pnpm run test
```

### Flutter Specific
```bash
# Get dependencies
cd apps/flutter-app && flutter pub get

# Build for different platforms
flutter build linux    # Desktop
flutter build apk      # Android mobile  
flutter build ipa      # iOS mobile
flutter build windows  # Windows desktop
flutter build macos    # macOS desktop
flutter build web      # Web build
```

## 🏗️ Architecture Principles to Follow

### 1. **Multi-Tenancy is Mandatory**
- Every database table **must** include `tenantId` field
- Never write queries without tenant filtering
- Use TenantScopeGuard in NestJS controllers/services
- In Flutter, always scope local queries to current tenant

### 2. **Offline-First Mindset (Flutter)**
- Assume network unavailable by default
- Use Drift ORM for local SQLite persistence
- Implement optimistic UI updates
- Sync queue processes when connectivity returns
- Critical operations (POS, orders) must work offline

### 3. **API-First Development**
- Backend is single source of truth
- Frontends consume only REST/Socket.IO APIs
- Never access database directly from frontend
- All business logic lives in NestJS services

### 4. **Responsible by Device Type**
Organize Flutter code by device folder:
```
presentation/
  mobile/    # Phone-specific UI
  tablet/    # Tablet-specific UI  
  desktop/   # Desktop/laptop UI
  tv/        # TV/kiosk display
```
Share business logic in `domain/` and `data/` layers.

### 5. **Entitlement-Based Access Control**
- Never check plan names for feature access
- Always check entitlements: `entitlements.features['module_key']`
- Use `EntitlementsGuard` in NestJS
- Use `entitlements.hasPermission()` in Flutter

## 💻 Technology-Specific Guidelines

### Backend (NestJS) - `apps/backend/`
- **DTOs:** Use class-validator decorators for all incoming data
- **Guards:** Apply `@UseGuards(JwtAuthGuard, TenantAuthGuard, PermissionsGuard)` to controllers
- **Services:** Keep business logic here, controllers thin
- **Entities:** Always include `@Column({ default: () => 'cuid()' })` for primary keys
- **Responses:** Format as `{ data, meta?: {}, errors?: [] }`
- **Exceptions:** Use HttpException with appropriate status codes
- **Tenancy:** Auto-inject tenantId via RequestContext middleware

### Frontend (Next.js) - Web Apps
- **App Router:** Use `app/` directory, not `pages/`
- **Components:** Prefer server components, use `'use client'` only when needed
- **Styling:** Tailwind CSS v4 with shadcn/ui primitives
- **Forms:** React Hook Form + Zod validation
- **State:** TanQuery for server state, Zustand for client state
- **Data Fetching:** Use `fetch` with `/api` route proxy or direct API calls
- **Error Handling:** Use error.tsx boundaries in app router

### Mobile/Desktop (Flutter) - `apps/flutter-app/`
- **State Management:** Riverpod (not Provider/setState)
- **Local DB:** Drift ORM for SQLite, never raw SQL
- **Networking:** Custom Dio client with interceptors for auth/tenant
- **Responsiveness:** Use `responsive_layout.dart` helper
- **Internationalization:** `app_localizations.dart` for all strings
- **Plugins:** Only use well-maintained packages (path_provider, connectivity_plus, etc.)
- **Architecture:** Feature-first with data/domain/presentation layers

## 🔑 Critical Conventions

### Database
- **Primary Keys:** Always use `cuid()` (string), never auto-increment integers
- **Soft Deletes:** Use `deletedAt` timestamp, never hard delete
- **Indexes:** Add `@@index` on frequently queried foreign keys
- **Money:** Use `@db.Decimal(precision: 10, scale: 2)` for currency
- **Timestamps:** `createdAt` and `updatedAt` on all tables

### Security
- **Authentication:** Never store tokens in localStorage (use HttpOnly cookies or secure storage)
- **Authorization:** Always check tenantId + permissions + entitlements
- **Input Validation:** Validate ALL inputs at DTO level (backend) and form level (frontend)
- **Secrets:** Never commit .env files, use environment variables
- **CORS:** Restrict to known domains in production

### Error Handling
- **Backend:** Use HttpException, log errors with context, don't expose internals
- **Frontend:** Show user-friendly messages, log details to console/error service
- **Flutter:** Use try/catch with proper error widgets, never let app crash
- **Logging:** Use structured logging, never log sensitive data (passwords, tokens)

## 🚫 Common Pitfalls to Avoid

1. **Forgetting tenantId** - Every query must filter by tenant
2. **Using integer IDs** - Always use cuid() strings for primary keys
3. **Direct DB access** - Frontends must never connect to database directly
4. **Hardcoding secrets** - Use environment variables, never commit keys
5. **Skipping validation** - Validate at every layer (DTO → Service → Entity)
6. **Blocking UI thread** - Use async/await, never synchronous network/db calls
7. **Ignoring offline** - Flutter must assume network unavailable 80% of time
8. **Mixing auth systems** - Admin and restaurant auth use separate systems
9. **Not checking entitlements** - Feature access = entitlement check, not plan check
10. **Large payloads** - Implement pagination, don't fetch unlimited records

## 📚 Documentation Resources

When you need deeper information, consult these files:

- **System Architecture:** `docs/platform/05_SYSTEM_ARCHITECTURE.md`
- **Tech Stack:** `docs/platform/06_TECH_STACK.md`  
- **Folder Structure:** `docs/platform/07_FOLDER_STRUCTURE.md`
- **Modules:** `docs/platform/08_MODULES.md`
- **API Documentation:** `docs/platform/21_API_DOCUMENTATION.md`
- **Data Model:** `docs/platform/22_DATABASE.md`
- **Feature List:** `docs/platform/09_FEATURES.md`

## 🛠️ Troubleshooting Common Issues

### "Cannot find tenantId" Errors
- Check that you're using the TenantAuthGuard middleware
- Verify request context is properly set
- In Flutters, ensure local queries include tenant filter

### Database Connection Issues
- Confirm Docker containers are running: `docker compose ps`
- Check .env matches docker-compose.yml values
- Run `npx prisma db pull` to sync schema with DB

### Build Failures
- Delete `node_modules` and `pnpm-lock.yaml`, then `pnpm install`
- For Flutter: `flutter clean` then `flutter pub get`
- Check Node.js version (use nvm, required version in package.json)

### Real-time Features Not Working
- Verify Socket.IO server is running on backend
- Check CORS settings allow frontend origins
- Ensure frontend Socket.IO client matches server version

## 🤝 Contributing Guidelines

### Before Coding
1. Read relevant documentation sections
2. Check existing similar implementations for patterns
3. Run linting: `pnpm run lint`
4. Ensure tests pass: `pnpm run test`

### When Making Changes
1. Follow existing code style exactly (no personal preferences)
2. Write tests for new functionality
3. Update documentation if changing APIs or processes
4. Consider backward compatibility
5. Test on all device types if UI changes

### PR Requirements
1. Clear title describing what and why
2. Description linking to relevant issues/designs
3. Screenshots for UI changes
4. Test results summary
5. Documentation updates if needed

## 💡 Pro Tips for Agents

### Navigation
- Use `grep -r` to find examples of patterns
- Check similar modules for implementation in `/modules/` or `/features/` for guidance
- Follow the file structure religiously - consistency over cleverness

### Debugging
- Backend: Enable debug logs in `main.ts` with `logger.log()`
- Frontend: Use React DevTools and Redux DevTools extensions
- Flutter: Use Flutter DevTools observatory
- Database: Use Prisma Studio for visual querying

### Performance
- Backend: Add database indexes for slow queries
- Frontend: Use React.memo() and useMemo() wisely
- Flutter: Use const constructors, const widgets, and repaint boundaries
- All: Implement pagination for lists >50 items

### When Stuck
1. Check if similar problem solved elsewhere in codebase
2. Look at failing tests for clues
3. Examine recent git history for related changes
4. Consult documentation before asking humans
5. Make small, testable changes rather than large speculative ones

---

*This guide is maintained as the single source of truth for agent effectiveness in the NexaROS repository. When in doubt, refer back to these principles and conventions.*