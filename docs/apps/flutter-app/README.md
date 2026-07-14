# Flutter App Documentation

> Detailed source: [apps/flutter-app/](../../apps/flutter-app/)

## Overview

NexaROS Flutter app for restaurant operations — offline-first, multi-platform (Android, iOS, Web, Desktop).

## Architecture

### State Management

- **AppState**: Global state (user, tenant, connectivity, socket)
- **SubscriptionProvider**: Subscription status, entitlements, grace period
- **BranchProvider**: Branch selection, branch list

### Core Features

- JWT authentication
- Offline-first with SQLite
- Real-time Socket.IO
- ESC/POS printer support
- Multi-branch support
- Subscription management

## Screens (26)

### Authentication

- `login_screen.dart` — Email/password login

### POS & Orders

- `pos_screen.dart` — Point of sale
- `orders_screen.dart` — Order list

### Kitchen

- `kitchen_screen.dart` — Kitchen display

### Menu

- `categories_screen.dart` — Menu categories
- `menu_items_screen.dart` — Menu items
- `menu_item_form_screen.dart` — Create/edit item
- `category_form_screen.dart` — Create/edit category

### Tables

- `tables_screen.dart` — Table management
- `table_form_screen.dart` — Create/edit table

### Payments

- `payments_screen.dart` — Payment processing

### Invoices

- `invoices_screen.dart` — Invoice list
- `invoice_detail_screen.dart` — Invoice details

### Inventory

- `inventory_screen.dart` — Inventory list
- `inventory_item_form_screen.dart` — Create/edit item

### Staff

- `staff_management_screen.dart` — Staff list
- `staff_form_screen.dart` — Create/edit staff
- `staff_branch_assignment_screen.dart` — Branch assignment

### Reservations

- `reservations_screen.dart` — Reservation list
- `reservation_form_screen.dart` — Create/edit reservation

### Reports

- `reports_screen.dart` — Report types
- `report_detail_screen.dart` — Report view

### Subscription

- `subscription_screen.dart` — Subscription status
- `coupon_redemption_screen.dart` — Coupon flow

### Branches

- `branch_management_screen.dart` — Branch CRUD

### More

- `more_grid_screen.dart` — Feature grid

## Widgets (11)

- `branch_switcher.dart` — Branch dropdown
- `subscription_status_bar.dart` — Subscription info
- `grace_period_banner.dart` — Grace warning
- `feature_locked_overlay.dart` — Locked overlay
- `pos_grid.dart` — POS item grid
- `pos_cart.dart` — Cart panel
- `order_card.dart` — Order display
- `kitchen_order_card.dart` — Kitchen order
- `table_card.dart` — Table display
- `menu_item_card.dart` — Menu item display

## Shells (3)

- `mobile_shell.dart` — Mobile layout
- `tablet_shell.dart` — Tablet layout
- `desktop_shell.dart` — Desktop layout

## Core

### Providers

- `app_state.dart` — Global state
- `subscription_provider.dart` — Subscription logic
- `branch_provider.dart` — Branch management

### Network

- `api_client.dart` — HTTP client
- `socket_service.dart` — Socket.IO

### Storage

- `local_database.dart` — SQLite
- `local_settings.dart` — Hive

### Utils

- `theme.dart` — Material 3 theme
- `constants.dart` — App constants
- `formatters.dart` — Date/currency formatters

## Key Features

### Entitlement-Based UI

```dart
// Hide features based on entitlements
if (entitlements['inventory'] == true)
  ListTile(title: 'Inventory'),

// Show locked overlay
FeatureLockedOverlay(
  feature: 'inventory',
  child: InventoryScreen(),
)
```

### Branch Switching

```dart
// Branch switcher in AppBar
BranchSwitcher(
  onBranchChanged: (branch) {
    setState(() => _currentBranch = branch);
  },
)
```

### Offline Mode

```dart
// Check connectivity
if (connectivityService.isOnline) {
  await apiClient.syncOrders();
} else {
  await localDatabase.saveOrder(order);
  syncQueue.addOperation(SyncOperation.create(order));
}
```

## Build Commands

```bash
# Debug
flutter run

# Release Android
flutter build apk --release

# Release iOS
flutter build ios --release

# Web
flutter build web
```

## Related Documents

- [Flutter App](32_FLUTTER_APP.md)
- [Multi-Branch](26_MULTI_BRANCH.md)
- [Offline-First](28_OFFLINE_FIRST.md)
