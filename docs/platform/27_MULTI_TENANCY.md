# Multi-Tenancy

> Detailed source: [apps/backend/src/modules/tenants/](../../apps/backend/src/modules/tenants/)

## Overview

NexaROS is a multi-tenant SaaS platform. Each restaurant is a tenant with complete data isolation.

## Tenant Model

```typescript
Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  businessType: string
  address: string
  city: string
  state: string
  country: string
  logo: string
  subscriptionId: string
  createdAt: Date
  updatedAt: Date
}
```

## Data Isolation

Every database query is scoped to `tenantId`:

```typescript
// Automatic scoping
async findAll(tenantId: string) {
  return this.prisma.menuItem.findMany({
    where: { tenantId }
  });
}
```

## Tenant Lifecycle

```
1. Registration → Tenant created
2. Onboarding → Profile completed
3. Active → Subscription active
4. Suspended → Payment issues
5. Archived → Closed account
```

## Tenant Features

Each tenant has:
- Multiple branches
- Multiple users
- Subscription plan
- Entitlements
- Feature flags
- Custom settings

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tenants` | List all tenants (admin) |
| GET | `/tenants/:id` | Get tenant details |
| PATCH | `/tenants/:id` | Update tenant |
| POST | `/tenants/:id/suspend` | Suspend tenant |
| POST | `/tenants/:id/activate` | Activate tenant |

## Tenant Onboarding

### Automatic Onboarding

When a restaurant registers:

```
1. Create Tenant
2. Create User (owner)
3. Create Default Branch
4. Create Default Roles
5. Create Default Permissions
6. Create 14-day Trial Subscription
7. Create Default Menu Categories
8. Create Sample Menu Items
```

### Manual Onboarding

Admin can onboard tenants:

```
1. Create Tenant (admin portal)
2. Set subscription plan
3. Configure entitlements
4. Create initial staff
5. Set operating hours
```

## Tenant Settings

```typescript
TenantSettings {
  currency: string
  timezone: string
  language: string
  taxRate: number
  serviceCharge: number
  operatingHours: Json
  holidays: Json
  printSettings: Json
  notificationSettings: Json
}
```

## Tenant Analytics

- Total tenants
- Active tenants
- Revenue per tenant
- Feature usage
- Growth metrics

## Related Documents

- [Multi-Branch](26_MULTI_BRANCH.md)
- [Subscription Lifecycle](40_SUBSCRIPTION_LIFECYCLE.md)
- [Modules](08_MODULES.md)
