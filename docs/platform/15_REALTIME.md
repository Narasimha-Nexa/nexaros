# Real-Time & WebSockets

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

### Usage in Flutter

```dart
// In POS screen
socketService.onOrderCreated((order) {
  // Refresh order list
  setState(() => _orders.insert(0, order));
  
  // Show notification
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('New order: ${order.id}')),
  );
});

// In Kitchen screen
socketService.onKotReady((kot) {
  // Add to kitchen queue
  setState(() => _kitchenQueue.add(kot));
  
  // Play alert sound
  _playAlertSound();
});
```

## Reconnection

```dart
class SocketService {
  // Auto-reconnect
  void _setupReconnect() {
    socket.onDisconnect((_) {
      // Try to reconnect
      Future.delayed(Duration(seconds: 5), () {
        connect(_token);
      });
    });
  }
}
```

## Error Handling

```dart
class SocketService {
  void _setupErrorHandling() {
    socket.onConnectError((error) {
      // Log error
      print('Connection error: $error');
      
      // Show user-friendly message
      _showError('Connection lost. Retrying...');
    });
    
    socket.onError((error) {
      // Log error
      print('Socket error: $error');
    });
  }
}
```

## Performance

### Optimization

- **Room-based broadcasting**: Only relevant clients receive events
- **Binary data**: Use msgpack for large payloads
- **Compression**: Enable gzip compression
- **Heartbeat**: 30-second ping/pong

### Monitoring

```typescript
// Server-side monitoring
@WebSocketGateway()
export class GatewayService {
  @SubscribeMessage('connection')
  handleConnection(client: Socket) {
    // Track connections
    this.metrics.increment('connections');
  }
  
  @SubscribeMessage('disconnect')
  handleDisconnect(client: Socket) {
    // Track disconnections
    this.metrics.decrement('connections');
  }
}
```

## Related Documents

- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
- [Flutter App](32_FLUTTER_APP.md)
- [Modules](08_MODULES.md)
