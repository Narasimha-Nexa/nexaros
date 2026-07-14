# NexaROS - Deployment Guide

## Quick Deploy

### 1. Backend (Railway) — Deploy First

1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. **New project** → **Deploy from GitHub repo** → Select `Narasimha-Nexa/nexaros`
3. Railway will auto-detect the monorepo. Go to **Service Settings**:
   - **Root Directory:** `apps/backend`
   - **Watch Paths:** `apps/backend/**`
4. Go to **Service Settings → Build**:
   - **Build Command:** `pnpm install --frozen-lockfile && pnpm db:generate && pnpm db:migrate:prod && pnpm build`
   - **Start Command:** `node dist/main.js`
5. Go to **Service Settings → Variables** and add:
   - `NODE_VERSION` = `22`
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (any random string, e.g. `nexaros-prod-jwt-secret-2026-key`)
   - `ADMIN_JWT_SECRET` = (any random string, e.g. `nexaros-prod-admin-secret-2026-key`)
6. Add **PostgreSQL** plugin (from the "+" button in the project):
   - It auto-creates `DATABASE_URL`
7. Add **Redis** plugin:
   - It auto-creates `REDIS_URL`
8. Wait for deployment to complete
9. Copy your backend URL (e.g. `https://nexaros-backend.up.railway.app`)
10. Verify: visit `https://your-backend-url/api/health` — should return `{"status":"ok"}`

### 2. Marketing Website (Netlify)

1. Go to [app.netlify.com](https://app.netlify.com) → Sign in with GitHub
2. **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** → Select `Narasimha-Nexa/nexaros`
4. Configure:
   - **Base directory:** `apps/marketing-web`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Add env var: `NODE_VERSION` = `22`
6. Click **Deploy**
7. Once deployed, go to **Site settings → Environment variables** and add:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app/api`

### 3. Admin Portal (Vercel)

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. **"Add new project"** → Import `Narasimha-Nexa/nexaros`
3. Configure:
   - **Root directory:** `apps/admin-portal`
   - **Framework:** Next.js (auto-detected)
4. Add env var:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app/api`
5. Click **Deploy**

### 4. Customer Website (Netlify) — Restaurant customer-facing ordering

This is the website customers see when they scan a QR code to order food.

1. Go to [app.netlify.com](https://app.netlify.com) → Sign in with GitHub
2. **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** → Select `Narasimha-Nexa/nexaros`
4. Configure:
   - **Base directory:** `apps/customer-web`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Add env var: `NODE_VERSION` = `22`
6. Click **Deploy**
7. Once deployed, go to **Site settings → Environment variables** and add:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app/api`

## After All 4 Are Deployed

Update the Netlify and Vercel env vars with the actual Railway backend URL:
- `NEXT_PUBLIC_API_URL` = `https://your-actual-backend.up.railway.app/api`

## Optional: GitHub Actions Auto-Deploy

Go to **GitHub repo → Settings → Secrets and variables → Actions** and add:

| Secret | Where to get it |
|---|---|
| `BACKEND_URL` | Your Railway backend URL (e.g. `https://nexaros-backend.up.railway.app`) |
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Marketing site → Build & deploy → Site information |
| `NETLIFY_CUSTOMER_SITE_ID` | Netlify → Customer site → Build & deploy → Site information |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID |
| `VERCEL_PROJECT_ID` | Vercel → Your project → Settings → General → Project ID |
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens |

## Local Development

```bash
# Install dependencies
pnpm install

# Start PostgreSQL + Redis (Docker)
docker compose -f docker/docker-compose.yml up -d

# Run database migrations
cd apps/backend && npx prisma migrate dev && npx prisma db seed

# Start backend (port 4000)
cd apps/backend && pnpm dev

# Start marketing website (port 3002)
cd apps/marketing-web && pnpm dev

# Start admin portal (port 3003)
cd apps/admin-portal && pnpm dev
```

## Demo Credentials

- **Marketing website:** Register at nexaros.com/register
- **Admin portal:** `admin@nexaros.com` / `admin123`
- **Backend API:** `localhost:4000/docs` (Swagger)
