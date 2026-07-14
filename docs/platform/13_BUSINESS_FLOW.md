# Business Logic Flow

## Order Lifecycle

### Order Creation

```
1. Staff selects table/takeout
2. Staff adds items to cart
3. System validates:
   - Items available
   - Stock sufficient
   - Table available
4. System calculates:
   - Subtotal
   - Tax (GST)
   - Service charge
   - Discount (if any)
   - Total
5. System creates order
6. System generates KOT
7. System prints KOT
8. System notifies kitchen
9. Table status → OCCUPIED
```

### Order Status Updates

```
PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED
    ↓                                               ↑
CANCELLED ←──────────────────────────────────────────┘
```

### Payment Processing

```
1. Order completed
2. Staff initiates payment
3. System creates payment record
4. System processes payment:
   - Cash: Record payment
   - UPI: Generate QR
   - Card: Process via gateway
   - Online: Redirect
5. System updates payment status
6. System generates invoice
7. System prints receipt
8. Table status → FREE
9. System updates reports
```

## Inventory Flow

### Stock Management

```
1. Item created
2. Initial stock added
3. Stock movements tracked:
   - Purchase: Stock in
   - Sale: Stock out
   - Adjustment: Manual change
   - Waste: Expired/damaged
4. Low stock alerts triggered
5. Reorder when needed
```

### Recipe Management

```
1. Menu item linked to inventory items
2. Recipe defines quantities
3. When order placed:
   - Recipe calculated
   - Inventory deducted
   - Stock movement created
4. Low stock checked
5. Alerts sent if needed
```

## Staff Flow

### Shift Management

```
1. Manager creates shift
2. Manager assigns staff
3. Staff clocks in
4. System validates PIN
5. System creates attendance
6. Staff works shift
7. Staff clocks out
8. System calculates hours
9. System updates attendance
```

### Permission System

```
1. Role created
2. Permissions assigned to role
3. Role assigned to user
4. User requests action
5. System checks permission
6. Action allowed/denied
7. Audit log created
```

## Subscription Flow

### Lifecycle

```
1. Restaurant registers
2. Trial created (14 days)
3. Trial expires
4. Payment pending
5. Grace period (7 days)
6. Restricted mode
7. Suspended (30 days)
8. Archived (90 days)
```

### Entitlements

```
1. Plan created
2. Entitlements defined
3. Tenant subscribes
4. Entitlements copied to subscription
5. Features enabled/disabled based on entitlements
6. Guard checks entitlement on access
```

## Multi-Branch Flow

### Branch Management

```
1. Owner creates branch
2. Plan limit checked
3. Branch created
4. Staff assigned to branch
5. Data scoped to branch
6. Branch switching enabled
```

### Data Isolation

```
1. User logs in
2. System determines branch
3. All queries scoped to branch
4. Cross-branch access prevented
5. Reports aggregated (if allowed)
```

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Modules](08_MODULES.md)
- [E2E Flow](14_E2E_FLOW.md)
