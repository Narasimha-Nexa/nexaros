# Notification System

## Types

### In-App Notifications

- Order status updates
- Payment confirmations
- Low stock alerts
- Staff clock in/out
- Reservation updates

### Push Notifications (Planned)

- New orders
- Order ready
- Low stock
- Subscription reminders
- Support ticket updates

### Email Notifications (Planned)

- Registration confirmation
- Password reset
- Subscription reminders
- Weekly reports
- Support ticket updates

## Implementation

### In-App

```dart
// Flutter
class NotificationService {
  final List<Notification> _notifications = [];
  
  void show(Notification notification) {
    _notifications.add(notification);
    notifyListeners();
  }
  
  void dismiss(String id) {
    _notifications.removeWhere((n) => n.id == id);
    notifyListeners();
  }
}
```

### Push (Planned)

```dart
// Firebase Cloud Messaging
class PushNotificationService {
  Future<void> initialize() async {
    FirebaseMessaging.onMessage.listen((message) {
      // Handle foreground message
    });
    
    FirebaseMessaging.onBackgroundMessage((message) {
      // Handle background message
    });
  }
  
  Future<void> subscribeToTopic(String topic) async {
    await FirebaseMessaging.instance.subscribeToTopic(topic);
  }
}
```

## Topics

| Topic | Description |
|-------|-------------|
| `tenant:{id}` | Tenant-wide |
| `branch:{id}` | Branch-specific |
| `role:{role}` | Role-specific |
| `kitchen:{branchId}` | Kitchen only |
| `pos:{branchId}` | POS only |

## Related Documents

- [Real-Time](29_REALTIME.md)
- [System Architecture](05_SYSTEM_ARCHITECTURE.md)
