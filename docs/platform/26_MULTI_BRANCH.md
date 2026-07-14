# Multi-Branch Management

> Detailed source: [apps/backend/src/modules/branches/](../../apps/backend/src/modules/branches/)

## Overview

NexaROS supports multi-branch restaurants. Branch limits are enforced by subscription plan.

## Plan Limits

| Plan | Max Branches | Max Staff |
|------|--------------|-----------|
| Starter Free | 1 | 5 |
| Professional | 3 | 20 |
| Business | 10 | 100 |
| Enterprise | Unlimited | Unlimited |

## Branch Model

```typescript
Branch {
  id: string
  tenantId: string
  name: string
  address: string
  city: string
  state: string
  phone: string
  email: string
  isPrimary: boolean
  isActive: boolean
  operatingHours: Json
  createdAt: Date
  updatedAt: Date
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/branches` | List branches (scoped to user) |
| GET | `/branches/:id` | Get branch details |
| POST | `/branches` | Create branch (plan limit check) |
| PATCH | `/branches/:id` | Update branch |
| DELETE | `/branches/:id` | Delete branch (cannot delete primary) |

## BranchScopeGuard

All data queries are automatically scoped to the user's branch:

```typescript
@UseGuards(BranchScopeGuard)
@Controller('menu')
export class MenuController {
  @Get('items')
  async findAll(@Request() req) {
    // Automatically scoped to req.user.branchId
    return this.menuService.findAll(req.user.tenantId, req.user.branchId);
  }
}
```

## Branch Switching

Users can switch branches in the Flutter app:

```
1. User taps branch selector
2. App calls: PATCH /api/auth/branch
3. Backend updates user's current branch
4. Returns new access token with branchId
5. App stores new token
6. All subsequent requests use new branch
```

## Data Isolation

Each branch has its own:
- Menu items (can share categories)
- Orders
- Tables
- Staff
- Inventory
- Reservations
- Reports

Cross-branch data access is prevented by `BranchScopeGuard`.

## Branch Management UI

### Flutter (Staff/Branch Assignment)

- **Branch Management Screen**: Full CRUD for branches
- **Staff Branch Assignment**: Reassign staff between branches
- **Branch Switcher**: Dropdown in AppBar (multi-branch) or badge (single branch)

### Admin Portal

- **Tenant Management**: View/edit tenant branches
- **Staff Management**: Assign staff to branches

## Related Documents

- [Multi-Tenancy](27_MULTI_TENANCY.md)
- [Staff Management](35_STAFF_MANAGEMENT.md)
- [Modules](08_MODULES.md)
