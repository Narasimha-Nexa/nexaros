# Kitchen Display System

## Overview

The Kitchen Display System (KDS) receives orders in real-time, tracks preparation status, and communicates with POS.

## Kitchen Display Flow

```
1. POS creates order
2. Server emits: order:created
3. Kitchen display receives order
4. Kitchen starts preparation
5. Kitchen updates status: PREPARING
6. Server emits: order:status-changed
7. Kitchen completes order
8. Kitchen updates status: READY
9. Server emits: order:ready
10. POS receives notification
11. Staff serves order
12. Server updates status: SERVED
```

## Order Status Flow

```
PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED
    ↓                                               ↑
CANCELLED ←──────────────────────────────────────────┘
```

## Kitchen Display Features

### Active Orders

```dart
class KitchenDisplay extends StatelessWidget {
  // Shows orders grouped by table
  // Color-coded by priority
  // Timer for each order
  // Swipe to update status
}
```

### Order Card

```dart
class OrderCard extends StatelessWidget {
  // Table number
  // Order items
  // Special instructions
  // Time elapsed
  // Status button
}
```

### Priority System

| Priority | Color | Description |
|----------|-------|-------------|
| Normal | Blue | Standard orders |
| High | Orange | Rush orders |
| Urgent | Red | VIP or delayed |

## KOT (Kitchen Order Ticket)

### KOT Generation

```
1. POS creates order
2. System generates KOT
3. KOT includes:
   - Order number
   - Table number
   - Items with quantities
   - Special instructions
   - Timestamp
4. KOT sent to kitchen printer
5. KOT displayed on kitchen screen
```

### KOT Data

```typescript
interface KOT {
  id: string;
  orderNumber: string;
  tableNumber: string;
  items: KOTItem[];
  priority: 'normal' | 'high' | 'urgent';
  specialInstructions: string;
  createdAt: Date;
  status: 'pending' | 'preparing' | 'ready';
}

interface KOTItem {
  name: string;
  quantity: number;
  variant: string;
  addOns: string[];
  notes: string;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/kitchen/orders` | Get active orders |
| GET | `/kitchen/orders/completed` | Get completed orders |
| PATCH | `/kitchen/orders/:id/status` | Update order status |

## Kitchen Screen UI

### Header

```
┌─────────────────────────────────────┐
│  Kitchen Display    [Branch: Main]  │
│  Active: 12  │  Preparing: 8       │
└─────────────────────────────────────┘
```

### Order Grid

```
┌──────────┬──────────┬──────────┐
│ Table 5  │ Table 12 │ Table 3  │
│ Normal   │ High     │ Urgent   │
│ 12:30    │ 12:25    │ 12:20    │
├──────────┼──────────┼──────────┤
│ • Burger │ • Pizza  │ • Thali  │
│ • Fries  │ • Salad  │ • Soup   │
│ • Coke   │         │         │
├──────────┼──────────┼──────────┤
│[PREPARE] │[READY]  │[SERVE]  │
└──────────┴──────────┴──────────┘
```

### Timer

```dart
class OrderTimer extends StatelessWidget {
  // Elapsed time since order
  // Color changes: green → yellow → red
  // 15 min: green
  // 15-30 min: yellow
  // >30 min: red
}
```

## Sound Alerts

```dart
class KitchenAlerts {
  // New order sound
  void playNewOrderSound();
  
  // Order ready sound
  void playOrderReadySound();
  
  // Urgent order sound
  void playUrgentSound();
}
```

## Related Documents

- [Orders](08_MODULES.md)
- [Real-Time](29_REALTIME.md)
- [Printer Integration](31_PRINTER.md)
