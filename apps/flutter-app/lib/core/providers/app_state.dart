import 'dart:async';
import 'package:flutter/material.dart';
import '../network/api_client.dart';
import '../network/socket_service.dart';
import '../network/connectivity_monitor.dart';
import '../database/local_database.dart';
import '../sync/offline_sync_service.dart';
import '../sync/offline_order_service.dart';
import '../sync/offline_payment_service.dart';
import '../hardware/printer_service.dart';
import '../services/event_bus.dart';

class AppState extends ChangeNotifier {
  final ApiClient api = ApiClient();
  final SocketService socket = SocketService();
  final ConnectivityMonitor connectivityMonitor = ConnectivityMonitor();
  final LocalDatabase db = LocalDatabase();
  late final OfflineSyncService sync;
  late final OfflineOrderService offlineOrders;
  late final OfflinePaymentService offlinePayments;
  final PrinterService printer = PrinterService();
  late final EventBus eventBus;
  late final StreamSubscription _connectivitySub;
  bool _eventBusInitialized = false;

  bool _isConnected = false;
  bool _isOnline = true;
  String? _tenantId;
  String? _branchId;

  bool get isConnected => _isConnected;
  bool get isOnline => _isOnline;
  String? get tenantId => _tenantId;
  String? get branchId => _branchId;

  AppState() {
    sync = OfflineSyncService(db, api);
    offlineOrders = OfflineOrderService(db, api);
    offlinePayments = OfflinePaymentService(db, api);
    eventBus = EventBus(socket);

    // Wire ConnectivityMonitor into AppState for UI reactivity
    _connectivitySub = connectivityMonitor.isConnected.listen((online) {
      _isOnline = online;
      notifyListeners();
    });
  }

  void setOnlineStatus(bool online) {
    _isOnline = online;
    notifyListeners();
  }

  void setTenantId(String tenantId) {
    _tenantId = tenantId;
  }

  void onLogin(String branchId) {
    final token = api.accessToken;
    if (token != null) {
      socket.connect(api.socketUrl, token);
      socket.joinBranch(branchId);
    }
    _isConnected = true;
    _branchId = branchId;
    printer.loadSettings();

    // Initialize the centralized event bus after socket is connected
    if (!_eventBusInitialized) {
      eventBus.initialize();
      _eventBusInitialized = true;
    }

    notifyListeners();
  }

  void onLogout() {
    eventBus.dispose();
    _eventBusInitialized = false;
    socket.disconnect();
    _isConnected = false;
    notifyListeners();
  }

  /// Legacy single-event listener — kept for backward compatibility
  /// Prefer using EventBus for new feature providers.
  void listenToEvent(String event, Function(dynamic) callback) {
    socket.on(event, callback);
  }

  void removeSocketListener(String event) {
    socket.off(event);
  }

  @override
  void dispose() {
    eventBus.dispose();
    sync.dispose();
    socket.disconnect();
    _connectivitySub.cancel();
    connectivityMonitor.dispose();
    super.dispose();
  }
}
