# Admin Portal

## Overview

Super Admin Portal at admin.nexaros.com — completely private, standalone Next.js 15 app.

## Features

### Dashboard

- Platform stats (tenants, revenue, MRR)
- Active subscriptions
- Recent activity feed
- System health

### Tenant Management

- List all tenants
- View tenant details
- Suspend/activate tenants
- View subscription status
- View branch count

### Subscription Management

- View all subscriptions
- Transition subscriptions
- Manage grace periods
- Process refunds
- View payment history

### Plan Management

- Create/edit plans
- Manage entitlements
- Set pricing
- Configure limits

### Coupon Management

- Create/edit coupons
- Festival campaigns
- Usage statistics
- Bulk operations

### Staff Management

- List all staff
- Assign roles
- View activity
- Deactivate staff

### Reports

- Platform analytics
- Revenue reports
- Tenant growth
- Feature usage

### Settings

- Platform configuration
- Maintenance mode
- Feature flags
- Email templates

## Authentication

### Separate Auth System

- Email: admin@nexaros.com
- Password: admin123
- MFA: TOTP (planned)
- JWT with admin secret

### Admin Roles

| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | Full access |
| ADMIN | Most functions |
| VIEWER | Read-only |

## Routes

| Route | Page |
|-------|------|
| `/login` | Admin login |
| `/` | Dashboard |
| `/tenants` | Tenant list |
| `/tenants/:id` | Tenant detail |
| `/subscriptions` | Subscription list |
| `/plans` | Plan management |
| `/coupons` | Coupon management |
| `/staff` | Staff list |
| `/reports` | Reports |
| `/settings` | Platform settings |

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS
- shadcn/ui components
- TypeScript
- JWT authentication
- Standalone output (Docker)

## Docker

```bash
# Build
docker build -f docker/Dockerfile.admin -t nexaros-admin .

# Run
docker run -p 3003:3003 nexaros-admin
```

## Related Documents

- [Admin Portal](34_ADMIN_PORTAL.md)
- [Authentication](23_AUTHENTICATION.md)
- [Modules](08_MODULES.md)
