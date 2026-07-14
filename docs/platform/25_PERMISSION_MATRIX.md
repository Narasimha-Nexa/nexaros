# Permission Matrix

## Role Permissions

### Owner

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| pos | ✅ | ✅ | ✅ | ✅ |
| orders | ✅ | ✅ | ✅ | ✅ |
| kitchen | ✅ | ✅ | ✅ | ✅ |
| tables | ✅ | ✅ | ✅ | ✅ |
| payments | ✅ | ✅ | ✅ | ✅ |
| invoices | ✅ | ✅ | ✅ | ✅ |
| menu | ✅ | ✅ | ✅ | ✅ |
| inventory | ✅ | ✅ | ✅ | ✅ |
| staff | ✅ | ✅ | ✅ | ✅ |
| reports | ✅ | ✅ | ✅ | ✅ |
| settings | ✅ | ✅ | ✅ | ✅ |

### Manager

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| pos | ✅ | ✅ | ✅ | ✅ |
| orders | ✅ | ✅ | ✅ | ✅ |
| kitchen | ✅ | ✅ | ✅ | ✅ |
| tables | ✅ | ✅ | ✅ | ✅ |
| payments | ✅ | ✅ | ✅ | ❌ |
| invoices | ✅ | ✅ | ✅ | ❌ |
| menu | ✅ | ✅ | ✅ | ✅ |
| inventory | ✅ | ✅ | ✅ | ✅ |
| staff | ✅ | ✅ | ✅ | ❌ |
| reports | ✅ | ✅ | ✅ | ❌ |
| settings | ❌ | ✅ | ❌ | ❌ |

### Cashier

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| pos | ✅ | ✅ | ✅ | ❌ |
| orders | ✅ | ✅ | ✅ | ❌ |
| kitchen | ❌ | ✅ | ❌ | ❌ |
| tables | ❌ | ✅ | ✅ | ❌ |
| payments | ✅ | ✅ | ❌ | ❌ |
| invoices | ✅ | ✅ | ❌ | ❌ |
| menu | ❌ | ✅ | ❌ | ❌ |
| inventory | ❌ | ✅ | ❌ | ❌ |
| staff | ❌ | ✅ | ❌ | ❌ |
| reports | ❌ | ✅ | ❌ | ❌ |
| settings | ❌ | ❌ | ❌ | ❌ |

### Kitchen

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| pos | ❌ | ✅ | ❌ | ❌ |
| orders | ❌ | ✅ | ✅ | ❌ |
| kitchen | ❌ | ✅ | ✅ | ❌ |
| tables | ❌ | ❌ | ❌ | ❌ |
| payments | ❌ | ❌ | ❌ | ❌ |
| invoices | ❌ | ❌ | ❌ | ❌ |
| menu | ❌ | ✅ | ❌ | ❌ |
| inventory | ❌ | ❌ | ❌ | ❌ |
| staff | ❌ | ❌ | ❌ | ❌ |
| reports | ❌ | ❌ | ❌ | ❌ |
| settings | ❌ | ❌ | ❌ | ❌ |

### Waiter

| Module | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| pos | ✅ | ✅ | ❌ | ❌ |
| orders | ✅ | ✅ | ❌ | ❌ |
| kitchen | ❌ | ✅ | ❌ | ❌ |
| tables | ❌ | ✅ | ✅ | ❌ |
| payments | ❌ | ❌ | ❌ | ❌ |
| invoices | ❌ | ❌ | ❌ | ❌ |
| menu | ❌ | ✅ | ❌ | ❌ |
| inventory | ❌ | ❌ | ❌ | ❌ |
| staff | ❌ | ❌ | ❌ | ❌ |
| reports | ❌ | ❌ | ❌ | ❌ |
| settings | ❌ | ❌ | ❌ | ❌ |

## Related Documents

- [Authorization](24_AUTHORIZATION.md)
- [Modules](08_MODULES.md)
