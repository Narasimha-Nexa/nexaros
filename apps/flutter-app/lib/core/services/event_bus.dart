import 'dart:async';
import '../network/socket_service.dart';

/// Types of events that flow through the event bus.
/// Each corresponds to backend WebSocket events emitted from the server.
enum BusEventType {
  menuUpdated,
  orderCreated,
  orderUpdated,
  orderStatusChanged,
  orderReady,
  tableStatusChanged,
  paymentReceived,
  paymentRefunded,
  reservationCreated,
  reservationUpdated,
  reservationDeleted,
  itemStatusChanged,
  notification,
  inventoryUpdated,
  stockLow,
  subscriptionChanged,
  staffUpdated,
  attendanceRecorded,
  shiftAssigned,
  deliveryAssigned,
  deliveryStatusChanged,
  deliveryLocation,
  couponUsed,
  customerCreated,
  customerUpdated,
  customerDeleted,
  loyaltyUpdated,
  walletUpdated,
}

/// A single event on the bus carries its type and the raw payload.
class BusEvent {
  final BusEventType type;
  final Map<String, dynamic> data;

  const BusEvent({required this.type, required this.data});
}

/// Centralized event bus that bridges SocketService WebSocket events
/// to all feature providers via typed streams.
///
/// Architecture:
///   Backend → Socket.IO → SocketService → EventBus → StreamControllers
///                                                    → MenuProvider listens
///                                                    → OrdersProvider listens
///                                                    → TablesProvider listens
///                                                    → PaymentsProvider listens
///                                                    → ReservationsProvider listens
///
/// Providers subscribe to specific [BusEventType]s. When a socket event arrives,
/// the EventBus parses it, creates a [BusEvent], and pushes it to all subscribers.
class EventBus {
  final SocketService _socket;

  /// Maps event types to their stream controllers
  final Map<BusEventType, StreamController<BusEvent>> _controllers = {};

  /// Track which socket events we've already registered listeners for
  final Set<String> _registeredSocketEvents = {};

  EventBus(this._socket);

  /// Get a broadcast stream for a specific event type.
  /// Multiple providers can listen to the same stream.
  Stream<BusEvent> on(BusEventType type) {
    if (!_controllers.containsKey(type)) {
      _controllers[type] = StreamController<BusEvent>.broadcast();
    }
    return _controllers[type]!.stream;
  }

  /// Subscribe a callback to a specific event type.
  /// Returns a StreamSubscription that the caller should cancel on dispose.
  StreamSubscription<BusEvent> listen(
    BusEventType type,
    void Function(BusEvent event) callback,
  ) {
    if (!_controllers.containsKey(type)) {
      _controllers[type] = StreamController<BusEvent>.broadcast();
    }
    return _controllers[type]!.stream.listen(callback);
  }

  /// Initialize the event bus — register all socket event listeners.
  /// Call this once after the socket is connected and has joined a branch.
  void initialize() {
    _register('menu:updated', BusEventType.menuUpdated);
    _register('order:created', BusEventType.orderCreated);
    _register('order:updated', BusEventType.orderUpdated);
    _register('order:status-changed', BusEventType.orderStatusChanged);
    _register('order:ready', BusEventType.orderReady);
    _register('table:status-changed', BusEventType.tableStatusChanged);
    _register('payment:received', BusEventType.paymentReceived);
    _register('payment:refunded', BusEventType.paymentRefunded);
    _register('reservation:created', BusEventType.reservationCreated);
    _register('reservation:updated', BusEventType.reservationUpdated);
    _register('reservation:deleted', BusEventType.reservationDeleted);
    _register('item:status-changed', BusEventType.itemStatusChanged);
    _register('notification', BusEventType.notification);
    _register('inventory:updated', BusEventType.inventoryUpdated);
    _register('inventory:low', BusEventType.stockLow);
    _register('subscription:status_changed', BusEventType.subscriptionChanged);
    _register('staff:updated', BusEventType.staffUpdated);
    _register('attendance:recorded', BusEventType.attendanceRecorded);
    _register('shift:assigned', BusEventType.shiftAssigned);
    _register('delivery:assigned', BusEventType.deliveryAssigned);
    _register('delivery:status-changed', BusEventType.deliveryStatusChanged);
    _register('delivery:location', BusEventType.deliveryLocation);
    _register('coupon:used', BusEventType.couponUsed);
    _register('crm:customer-created', BusEventType.customerCreated);
    _register('crm:customer-updated', BusEventType.customerUpdated);
    _register('crm:customer-deleted', BusEventType.customerDeleted);
    _register('crm:loyalty-updated', BusEventType.loyaltyUpdated);
    _register('crm:wallet-updated', BusEventType.walletUpdated);
  }

  /// Register a single socket event → BusEventType mapping.
  void _register(String socketEvent, BusEventType busType) {
    if (_registeredSocketEvents.contains(socketEvent)) return;
    _registeredSocketEvents.add(socketEvent);

    _socket.on(socketEvent, (dynamic data) {
      final event = BusEvent(
        type: busType,
        data: (data is Map<String, dynamic>) ? data : {},
      );
      _push(busType, event);
    });
  }

  /// Push an event to all subscribers of a type.
  void _push(BusEventType type, BusEvent event) {
    final controller = _controllers[type];
    if (controller != null && !controller.isClosed) {
      controller.add(event);
    }
  }

  /// Remove all socket listeners to prevent memory leaks.
  /// Does NOT close stream controllers — providers still hold subscriptions
  /// to them. On re-login, initialize() will re-register socket listeners
  /// and events will flow to the existing (active) controllers.
  void dispose() {
    for (final socketEvent in _registeredSocketEvents) {
      _socket.off(socketEvent);
    }
    _registeredSocketEvents.clear();
    // Do NOT close controllers — providers keep their StreamSubscription references
  }
}
