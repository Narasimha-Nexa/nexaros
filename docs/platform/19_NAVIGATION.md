# Navigation

## Flutter App Navigation

### Shell-Based Navigation

```
App
├── LoginScreen (unauthenticated)
└── Shell (authenticated)
    ├── MobileShell
    │   ├── AppBar (branch switcher)
    │   ├── Body (screen)
    │   └── BottomNav
    │       ├── POS
    │       ├── Orders
    │       ├── Kitchen
    │       └── More
    ├── TabletShell
    │   ├── AppBar (branch switcher)
    │   ├── NavigationRail
    │   └── Body (screen)
    └── DesktopShell
        ├── Sidebar (branch switcher + nav)
        └── Body (screen)
```

### Screen Routes

| Route | Screen | Description |
|-------|--------|-------------|
| `/login` | LoginScreen | Authentication |
| `/pos` | POSScreen | Point of sale |
| `/orders` | OrdersScreen | Order list |
| `/kitchen` | KitchenScreen | Kitchen display |
| `/tables` | TablesScreen | Table management |
| `/menu` | MenuItemsScreen | Menu items |
| `/categories` | CategoriesScreen | Menu categories |
| `/inventory` | InventoryScreen | Stock management |
| `/staff` | StaffManagementScreen | Staff list |
| `/reservations` | ReservationsScreen | Bookings |
| `/reports` | ReportsScreen | Analytics |
| `/invoices` | InvoicesScreen | Invoice list |
| `/subscriptions` | SubscriptionScreen | Plan management |
| `/branches` | BranchManagementScreen | Branch CRUD |
| `/staff-assignment` | StaffBranchAssignmentScreen | Staff-branch |
| `/more` | MoreGridScreen | Feature grid |

### Navigation Methods

```dart
// Push route
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => Screen()),
);

// Push named route
Navigator.pushNamed(context, '/screen');

// Pop route
Navigator.pop(context);

// Replace route
Navigator.pushReplacement(
  context,
  MaterialPageRoute(builder: (context) => Screen()),
);
```

## Marketing Website Navigation

### Routes

| Route | Page |
|-------|------|
| `/` | Landing |
| `/about` | About |
| `/pricing` | Pricing |
| `/contact` | Contact |
| `/register` | Registration |
| `/login` | Login |
| `/blog` | Blog |
| `/docs` | Docs |

### Navigation Component

```tsx
// Navbar.tsx
const navItems = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Docs', href: '/docs' },
];
```

## Admin Portal Navigation

### Routes

| Route | Page |
|-------|------|
| `/login` | Login |
| `/` | Dashboard |
| `/tenants` | Tenants |
| `/subscriptions` | Subscriptions |
| `/plans` | Plans |
| `/coupons` | Coupons |
| `/staff` | Staff |
| `/reports` | Reports |
| `/settings` | Settings |

## Related Documents

- [Screen Flow](11_SCREEN_FLOW.md)
- [Screen Inventory](10_SCREEN_INVENTORY.md)
