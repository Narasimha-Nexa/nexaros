# Real-Time System

## Overview

NexaROS uses Socket.IO for real-time updates between POS, Kitchen, and Tables.

## Socket.IO Events

### Order Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `order:created` | Server → All | { order, table } |
| `order:updated` | Server → All | { order } |
| `order:status-changed` | Server → All | { orderId, oldStatus, newStatus } |
| `order:ready` | Server → Kitchen | { order, items } |
| `order:cancelled` | Server → All | { orderId, reason } |

### Table Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `table:status-changed` | Server → All | { tableId, oldStatus, newStatus } |
| `table:reserved` | Server → All | { table, reservation } |

### Payment Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `payment:received` | Server → All | { payment, order } |
| `payment:refunded` | Server → All | { payment, refund } |

### Kitchen Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `kot:ready` | Server → Kitchen | { order, items, priority } |
| `kot:completed` | Server → POS | { orderId, items } |

### Menu Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `menu:updated` | Server → All | { category, item } |
| `menu:availability-changed` | Server → All | { itemId, isAvailable } |

## Connection Flow

```
1. Client connects: socket.io('http://localhost:4000')
2. Client joins room: socket.join(`tenant:${tenantId}:branch:${branchId}`)
3. Server authenticates JWT
4. Client subscribes to events
5. Server broadcasts events to room
```

## Room Structure

```
tenant:{tenantId}:branch:{branchId}
├── pos:{branchId}
├── kitchen:{branchId}
├── tables:{branchId}
└── admin:{tenantId}
```

## Flutter Integration

### SocketService

```dart
class SocketService {
  // Connect to server
  Future<void> connect(String token);
  
  // Join branch room
  void joinBranch(String tenantId, String branchId);
  
  // Listen to events
  void onOrderCreated(Function callback);
  void onOrderStatusChanged(Function callback);
  void onTableStatusChanged(Function callback);
  void onPaymentReceived(Function callback);
  void onKotReady(Function callback);
  
  // Disconnect
  void disconnect();
}
```

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Flutter App](32_FLUTTER_APP.md)
- [Modules](08_MODULES.md)
