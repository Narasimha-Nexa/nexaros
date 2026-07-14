# Authorization

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|------|-------------|
| OWNER | Full access to all features |
| MANAGER | Most features except settings |
| CASHIER | POS, orders, payments |
| KITCHEN | Kitchen display only |
| WAITER | Orders, tables |
| VIEWER | Read-only access |

### Permissions

| Module | Permission | Description |
|--------|------------|-------------|
| pos | create | Create orders |
| pos | read | View orders |
| pos | update | Update orders |
| pos | delete | Cancel orders |
| orders | create | Create orders |
| orders | read | View orders |
| orders | update | Update status |
| orders | delete | Cancel orders |
| kitchen | read | View kitchen orders |
| kitchen | update | Update status |
| tables | read | View tables |
| tables | update | Update status |
| payments | create | Process payments |
| payments | read | View payments |
| payments | refund | Process refunds |
| invoices | create | Generate invoices |
| invoices | read | View invoices |
| menu | create | Create items |
| menu | read | View items |
| menu | update | Update items |
| menu | delete | Delete items |
| inventory | create | Create items |
| inventory | read | View items |
| inventory | update | Update items |
| inventory | delete | Delete items |
| staff | create | Create staff |
| staff | read | View staff |
| staff | update | Update staff |
| staff | delete | Delete staff |
| reports | read | View reports |
| reports | export | Export reports |
| settings | read | View settings |
| settings | update | Update settings |

## Implementation

### PermissionsGuard

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );
    
    if (!requiredPermissions) return true;
    
    const user = context.switchToHttp().getRequest().user;
    
    return requiredPermissions.every(permission =>
      user.permissions.includes(permission)
    );
  }
}
```

### Usage

```typescript
@UseGuards(PermissionsGuard)
@SetMetadata('permissions', ['menu:create', 'menu:update'])
@Post('items')
async createItem(@Body() createItemDto: CreateItemDto) {
  return this.menuService.createItem(createItemDto);
}
```

## Entitlements vs Permissions

| Concept | Scope | Purpose |
|---------|-------|---------|
| Entitlements | Plan-level | Feature access |
| Permissions | User-level | Action access |

## Related Documents

- [Authentication](23_AUTHENTICATION.md)
- [Modules](08_MODULES.md)
