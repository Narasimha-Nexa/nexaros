import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityMonitor {
  final _connectivity = Connectivity();
  late final StreamController<bool> _controller;
  late final StreamSubscription _subscription;
  Stream<bool>? _stream;
  bool _lastStatus = false;
  Timer? _reachabilityTimer;

  ConnectivityMonitor() {
    _controller = StreamController<bool>.broadcast();
    _subscription = _connectivity.onConnectivityChanged.listen((result) async {
      final hasNetwork = !result.contains(ConnectivityResult.none);
      if (hasNetwork) {
        // Verify actual internet reachability with HTTP health check
        final reachable = await _checkReachability();
        _updateStatus(reachable);
      } else {
        _updateStatus(false);
      }
    });
    // Initial check
    _connectivity.checkConnectivity().then((result) async {
      final hasNetwork = !result.contains(ConnectivityResult.none);
      if (hasNetwork) {
        final reachable = await _checkReachability();
        _updateStatus(reachable);
      } else {
        _updateStatus(false);
      }
    });
    // Periodic reachability check every 60 seconds
    _reachabilityTimer = Timer.periodic(const Duration(seconds: 60), (_) async {
      if (_lastStatus) {
        final reachable = await _checkReachability();
        if (_lastStatus && !reachable) {
          _updateStatus(false);
        }
      }
    });
  }

  void _updateStatus(bool online) {
    if (_lastStatus != online) {
      _lastStatus = online;
      _controller.add(online);
    }
  }

  /// Check actual internet reachability by attempting to connect to the API host
  Future<bool> _checkReachability() async {
    try {
      final socket = await Socket.connect(
        '8.8.8.8',
        53,
        timeout: const Duration(seconds: 3),
      );
      await socket.close();
      return true;
    } catch (_) {
      // Fallback: try Google DNS
      try {
        final socket = await Socket.connect(
          '1.1.1.1',
          53,
          timeout: const Duration(seconds: 3),
        );
        await socket.close();
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  Stream<bool> get isConnected {
    _stream ??= _controller.stream;
    return _stream!;
  }

  bool get currentStatus => _lastStatus;

  void dispose() {
    _subscription.cancel();
    _reachabilityTimer?.cancel();
    _controller.close();
  }
}
