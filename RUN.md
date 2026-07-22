# NexaROS — How to Run Everything

## Prerequisites

| Tool | Version | Required For | Install |
|------|---------|-------------|---------|
| Docker Desktop | latest | PostgreSQL + Redis | https://www.docker.com/products/docker-desktop/ |
| Node.js | >=22.0.0 | Backend + all web apps | https://nodejs.org/ |
| pnpm | >=9.0.0 | Package manager | `npm install -g pnpm` |
| Flutter SDK | >=3.12.0 <4.0.0 | Mobile/desktop app | https://docs.flutter.dev/get-started/install |
| ngrok or cloudflared | latest | Webhook testing (WhatsApp) | See Section 10 |

---

## Port Reference

| Service | Default Port | Where Defined |
|---------|-------------|---------------|
| PostgreSQL | **5433** (host) -> 5432 (container) | `docker/docker-compose.yml` |
| Redis | **6379** | `docker/docker-compose.yml` |
| Backend API | **4000** | `apps/backend/.env` (`PORT=4000`) |
| Customer Web | **3001** | `apps/customer-web/package.json` |
| Marketing Web | **3002** | `apps/marketing-web/package.json` |
| Admin Portal | **3003** | `apps/admin-portal/package.json` |
| Flutter App | varies by platform | `apps/flutter-app/` |
| Supabase Studio | 54323 | `docker/docker-compose.yml` |
| Supabase Kong | 54321 | `docker/docker-compose.yml` |
| Supabase DB | 54322 | `docker/docker-compose.yml` |

> **Important:** All frontend apps and Flutter connect to the backend at `http://localhost:4000`.
> The backend `.env` MUST have `PORT=4000` for everything to work. Do not change it unless you also update all frontend `.env.local` files.

---

## Dependency Graph

```
PostgreSQL (5433) ─┐
                   ├────► Backend API (4000) ◄── all frontends connect here
Redis (6379) ──────┘
                         ▲
                         │
    ┌────────────────────┼─────────────────────┐
    │                    │                     │
Customer Web (3001)  Marketing Web (3002)  Admin Portal (3003)
    │                                             │
    └──── Socket.IO ──────── REST ────────────────┘
                                            Flutter App (mobile/desktop)
```

---

## Quick Start — Run Everything

```bash
# 1. Start infrastructure
pnpm docker:up

# 2. Setup database (first time only)
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# 3. Start all 4 web services in parallel
pnpm dev:all
```

This starts:
- Backend API on http://localhost:4000
- Customer Web on http://localhost:3001
- Marketing Web on http://localhost:3002
- Admin Portal on http://localhost:3003

---

## Individual App Guides

### 1. Backend API (NestJS) — Port 4000

**Prerequisites:** Docker (PostgreSQL + Redis)

```bash
# Start infrastructure first
pnpm docker:up

# Database setup (first time or after schema changes)
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# Start backend
pnpm dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:4000 | API base |
| http://localhost:4000/docs | Swagger docs |
| http://localhost:4000/api/v1/health | Health check |
| http://localhost:4000/api/v1 | Liveness check |

**What it depends on:**
- PostgreSQL on port 5433
- Redis on port 6379
- Prisma schema must be migrated

---

### 2. Customer Web (Next.js) — Port 3001

**Prerequisites:** Backend API running on port 4000

```bash
# Option A: From root
pnpm dev:customer

# Option B: Direct
cd apps/customer-web && pnpm dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3001 | Homepage |
| http://localhost:3001/restaurant/[slug] | Menu view |
| http://localhost:3001/restaurant/[slug]/table/[tableId] | QR table ordering |
| http://localhost:3001/login | Customer login |
| http://localhost:3001/orders | Order history |

**What it depends on:**
- Backend API on port 4000 (REST + Socket.IO)
- Environment: `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`

---

### 3. Marketing Web (Next.js) — Port 3002

**Prerequisites:** Backend API running on port 4000

```bash
# Option A: From root
pnpm dev:marketing

# Option B: Direct
cd apps/marketing-web && pnpm dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3002 | Homepage / Landing |
| http://localhost:3002/pricing | Pricing page |
| http://localhost:3002/blog | Blog |
| http://localhost:3002/docs | Documentation |
| http://localhost:3002/faq | FAQ |
| http://localhost:3002/about | About |
| http://localhost:3002/contact | Contact |

**What it depends on:**
- Backend API on port 4000 (REST only, no Socket.IO)
- Environment: `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`

---

### 4. Admin Portal (Next.js) — Port 3003

**Prerequisites:** Backend API running on port 4000

```bash
# Option A: From root
pnpm dev:admin

# Option B: Direct
cd apps/admin-portal && pnpm dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3003 | Login → Dashboard |
| http://localhost:3003/tenants | Tenant management |
| http://localhost:3003/billing | Billing & subscriptions |
| http://localhost:3003/settings | Platform settings |
| http://localhost:3003/analytics | BI / Executive analytics |

**Login credentials:** `admin@nexaros.com` / `admin123`

**What it depends on:**
- Backend API on port 4000 (REST + Socket.IO)
- Environment: `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`

---

### 5. Flutter App (Mobile/Desktop)

**Prerequisites:** Backend API running on port 4000 + Flutter SDK

```bash
cd apps/flutter-app

# Get dependencies
flutter pub get

# Run on different platforms
flutter run -d chrome        # Web browser
flutter run -d linux         # Linux desktop
flutter run -d android       # Android device/emulator
flutter run -d ios           # iOS simulator (macOS only)
flutter run -d windows       # Windows desktop
```

**Custom backend URL:**
```bash
flutter run -d linux --dart-define=API_URL=http://localhost:4000/api/v1 --dart-define=SERVER_URL=http://localhost:4000
```

**What it depends on:**
- Backend API on port 4000 (REST + Socket.IO)
- Flutter SDK >=3.12.0
- For Android: Android Studio + emulator
- For iOS: Xcode + simulator (macOS only)

---

## All Possible Run Combinations

### Infrastructure First (Always)

```bash
pnpm docker:up              # PostgreSQL (5433) + Redis (6379)
```

### Combination Matrix

| # | What You Want to Run | Commands (in order) | Ports Used |
|---|---------------------|---------------------|------------|
| **1** | Backend only | `docker:up` → `db:generate` → `db:migrate` → `dev` | 5433, 6379, 4000 |
| **2** | Backend + Customer Web | `docker:up` → `db:*` → `dev` → `dev:customer` | + 3001 |
| **3** | Backend + Marketing Web | `docker:up` → `db:*` → `dev` → `dev:marketing` | + 3002 |
| **4** | Backend + Admin Portal | `docker:up` → `db:*` → `dev` → `dev:admin` | + 3003 |
| **5** | Backend + Flutter | `docker:up` → `db:*` → `dev` → `flutter run` | + varies |
| **6** | All 4 web apps | `docker:up` → `db:*` → `dev:all` | 4000, 3001, 3002, 3003 |
| **7** | All + Flutter | `docker:up` → `db:*` → `dev:all` (separate terminal: `flutter run`) | all |
| **8** | Everything in Docker | `docker:up:full` | 5433, 6379, 4000, 3001, 3002, 3003 |
| **9** | Infra + Backend Docker, Frontends local | `docker:up` (infra only) → local backend → local frontends | mixed |

### One-Line Commands for Each Combination

```bash
# 1. Backend only
pnpm docker:up && pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm dev

# 2. Backend + Customer Web (2 terminals)
# Terminal 1: pnpm docker:up && pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm dev
# Terminal 2: pnpm dev:customer

# 3. Backend + Marketing Web (2 terminals)
# Terminal 1: pnpm docker:up && pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm dev
# Terminal 2: pnpm dev:marketing

# 4. Backend + Admin Portal (2 terminals)
# Terminal 1: pnpm docker:up && pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm dev
# Terminal 2: pnpm dev:admin

# 5. Backend + Flutter (2 terminals)
# Terminal 1: pnpm docker:up && pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm dev
# Terminal 2: cd apps/flutter-app && flutter run -d linux

# 6. Everything (1 command + optional flutter)
pnpm docker:up && pnpm db:generate && pnpm db:migrate && pnpm db:seed && pnpm dev:all
# Optional: cd apps/flutter-app && flutter run -d linux

# 7. All in Docker (production-like)
pnpm docker:up:full
```

---

## Docker Commands Reference

```bash
# Start infrastructure only (PostgreSQL + Redis)
pnpm docker:up

# Start app containers only (Backend + all frontends in Docker)
pnpm docker:up:apps

# Start everything in Docker (6 containers)
pnpm docker:up:full

# Stop everything
pnpm docker:down

# Restart infrastructure
pnpm docker:restart

# View logs
pnpm docker:logs          # All containers
pnpm docker:logs:infra    # PostgreSQL + Redis only

# View specific container logs
docker logs nexaros-backend -f
docker logs nexaros-customer -f
```

---

## Database Commands Reference

```bash
# Generate Prisma client (after schema changes)
pnpm db:generate

# Apply migrations (safe, never resets data)
pnpm db:migrate

# Seed demo data (upserts only)
pnpm db:seed

# Open Prisma Studio (visual DB browser)
pnpm db:studio

# Full reset (DESTRUCTIVE — deletes all data)
pnpm db:reset && pnpm db:seed
```

> **Data Persistence:** PostgreSQL data lives in Docker volume `docker_nexaros_postgres_data`
> and persists across `docker compose down` / `up`. Never run `docker compose down -v`.

---

## Environment Files

| File | Key Variables |
|------|--------------|
| `apps/backend/.env` | `PORT=4000`, `DATABASE_URL`, `REDIS_HOST`, `JWT_SECRET`, WhatsApp credentials |
| `apps/customer-web/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` |
| `apps/marketing-web/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` |
| `apps/admin-portal/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1` |
| `apps/flutter-app` | Uses `--dart-define=API_URL=http://localhost:4000/api/v1` |

---

## Testing Individual Services

### Backend Health Check
```bash
curl http://localhost:4000/api/v1/health
# Returns: { status: 'ok', database: 'connected', redis: 'connected' }
```

### Swagger API Docs
```bash
open http://localhost:4000/docs
```

### Admin Portal Login
```
URL:      http://localhost:3003
Email:    admin@nexaros.com
Password: admin123
```

### Customer Web
```
URL:      http://localhost:3001
Restaurant: http://localhost:3001/restaurant/[slug]
```

---

## Troubleshooting

### "Connection refused" on port 4000
- Backend isn't running. Start it: `pnpm dev`
- Or check: `ss -tlnp | grep 4000`

### "ECONNREFUSED" to PostgreSQL (5433)
- Docker containers not running. Start: `pnpm docker:up`
- Wait 10 seconds for health checks

### Frontend shows "Failed to fetch"
- Backend not running on port 4000
- Check `NEXT_PUBLIC_API_URL` in `.env.local` matches backend port
- Check CORS: backend must allow `http://localhost:300x`

### Prisma errors after schema change
```bash
pnpm db:generate   # Regenerate client
pnpm db:migrate    # Apply new migrations
```

### Port already in use
```bash
# Find what's using the port
ss -tlnp | grep :4000
# Kill it or change the port in .env
```

### "Module not found" errors
```bash
pnpm install       # Reinstall dependencies
pnpm db:generate   # Regenerate Prisma client
```

### Flutter build fails
```bash
cd apps/flutter-app
flutter clean
flutter pub get
flutter run
```

### Docker containers won't start
```bash
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d
docker logs nexaros-postgres   # Check for errors
```

---

## Monorepo Scripts Quick Reference

| Command | What It Does |
|---------|-------------|
| `pnpm dev` | Start backend only |
| `pnpm dev:customer` | Start customer web only |
| `pnpm dev:marketing` | Start marketing web only |
| `pnpm dev:admin` | Start admin portal only |
| `pnpm dev:all` | Start backend + all 3 web apps in parallel |
| `pnpm build` | Build backend for production |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:seed` | Seed database with demo data |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `pnpm docker:up` | Start PostgreSQL + Redis |
| `pnpm docker:up:full` | Start all 6 Docker containers |
| `pnpm docker:down` | Stop all Docker containers |
| `pnpm docker:logs` | Follow all Docker logs |
