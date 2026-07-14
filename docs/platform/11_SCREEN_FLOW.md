# Screen Flow

## Flutter App — Navigation Flow

### Shell Routing

```
Login Screen
    │
    ├── (width > 900px) ──→ DesktopShell
    ├── (600-900px) ──────→ TabletShell
    └── (< 600px) ────────→ MobileShell
```

### Mobile Shell (Bottom Navigation)

```
MobileShell
├── [0] Dashboard
├── [1] Orders ──────────→ OrderDetail
├── [2] Menu ────────────→ MenuItemForm (create/edit)
├── [3] Tables ──────────→ TableDetail (via status tap)
├── [4] POS ─────────────→ BillPreview ──→ Payment
└── [5] More Grid
    ├── Kitchen ──────────→ KitchenDisplayScreen
    ├── Staff ────────────→ StaffManagementScreen
    ├── Attendance ───────→ AttendanceScreen
    ├── Shifts ───────────→ ShiftScheduleScreen
    ├── Inventory ────────→ InventoryManagementScreen
    ├── Suppliers ────────→ SupplierManagementScreen
    ├── Purchases ────────→ PurchaseOrderScreen
    ├── Reservations ─────→ ReservationScreen
    ├── Reports ──────────→ ReportsScreen
    ├── Branches ─────────→ BranchManagementScreen
    ├── Staff Assign ─────→ StaffBranchAssignmentScreen
    └── Subscription ─────→ SubscriptionScreen ──→ CouponRedemptionScreen
```

### Desktop Shell (Sidebar Navigation)

```
DesktopShell
├── Sidebar
│   ├── Branch Switcher (dropdown)
│   ├── Dashboard
│   ├── Orders
│   ├── Menu
│   ├── Tables
│   ├── POS
│   ├── Kitchen
│   ├── Staff
│   ├── Attendance
│   ├── Shifts
│   ├── Inventory
│   ├── Suppliers
│   ├── Purchases
│   ├── Reservations
│   ├── Divider
│   ├── Subscription
│   ├── Settings (Printer)
│   ├── Branches (Management)
│   └── Staff Assignment
└── Content Area (selected page)
```

### Tablet Shell (Navigation Rail)

```
TabletShell
├── NavigationRail (Left)
│   ├── Logo
│   ├── Branch Switcher
│   ├── Dashboard
│   ├── Orders
│   ├── Menu
│   ├── Tables
│   ├── POS
│   ├── Kitchen
│   ├── Staff
│   ├── More
│   └── Subscription (trailing)
└── Content Area (selected page)
```

## Key Screen Transitions

### Order Flow
```
POS → Create Order → Add Items → Submit → Bill Preview → Payment → Success
                        ↓
                  Kitchen Display (KOT printed)
                        ↓
                  Order List (status updates via Socket.IO)
```

### Payment Flow
```
Bill Preview
    ├── Cash → Success
    ├── UPI → QR Code → Success
    ├── Card → Terminal → Success
    ├── Wallet → Success
    ├── Online → Redirect → Success
    └── Coupon → Discount → Success
```

### Subscription Flow
```
Subscription Screen
    ├── View Current Plan
    ├── View Entitlements Grid
    ├── View Plans → Select Plan → Checkout
    ├── Apply Coupon → Discount
    └── Payment Promise (if restricted)
```

## Marketing Web — Navigation

```
Navbar
├── Logo (Home)
├── Features
├── Pricing
├── Custom Plan
├── Blog
├── Docs
├── Login
└── Register (CTA)

Footer
├── Product (Features, Pricing, Custom Plan, Status)
├── Resources (Blog, Docs, FAQ, Changelog)
├── Company (About, Careers, Partners, Contact)
├── Legal (Privacy, Terms, Refund, Security)
└── Social (GitHub, Twitter, LinkedIn)
```

## Admin Portal — Navigation

```
Sidebar
├── Dashboard (overview charts)
├── Restaurants (tenant list)
├── Subscriptions (plan management)
├── Billing (payment tracking)
├── Coupons (coupon management)
├── Demo Requests (pipeline)
├── Support (ticket system)
├── Admin Users (user management)
├── Audit Logs (activity trail)
├── Payment Promises (deferred payments)
└── Settings (platform config)
```

## Related Documents

- [Screen Inventory](10_SCREEN_INVENTORY.md)
- [User Flow](12_USER_FLOW.md)
- [Navigation](19_NAVIGATION.md)
