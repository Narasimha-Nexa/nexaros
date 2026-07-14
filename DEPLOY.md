# NexaROS - Deployment Guide

## Quick Deploy

### 1. Marketing Website (Netlify)

1. Push to GitHub (already done)
2. Go to [app.netlify.com](https://app.netlify.com)
3. "Add new site" → "Import an existing project"
4. Select `Narasimha-Nexa/nexaros`
5. Configure:
   - **Base directory:** `apps/marketing-web`
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
6. Add environment variable: `NODE_VERSION = 22`
7. Deploy

### 2. Admin Portal (Vercel)

1. Go to [vercel.com](https://vercel.com)
2. "Add new project" → Import `Narasimha-Nexa/nexaros`
3. Configure:
   - **Root directory:** `apps/admin-portal`
   - **Framework:** Next.js (auto-detected)
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend URL + `/api`
5. Deploy

### 3. Backend (Railway)

1. Go to [railway.app](https://railway.app)
2. "New project" → "Deploy from GitHub repo"
3. Select `Narasimha-Nexa/nexaros`
4. Configure:
   - **Root directory:** `apps/backend`
   - **Build command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start command:** `node dist/main.js`
5. Add PostgreSQL plugin → get `DATABASE_URL`
6. Add Redis plugin → get `REDIS_URL`
7. Add environment variables:
   - `NODE_ENV = production`
   - `JWT_SECRET = <random-string>`
   - `ADMIN_JWT_SECRET = <random-string>`
8. Deploy

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
