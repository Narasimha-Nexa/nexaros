import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

class ConnectivityMonitor {
  final _connectivity = Connectivity();
  late final StreamController<bool> _controller;
  late final StreamSubscription _subscription;
  Stream<bool>? _stream;

  ConnectivityMonitor() {
    _controller = StreamController<bool>.broadcast();
    _subscription = _connectivity.onConnectivityChanged.listen((result) {
      _controller.add(result != ConnectivityResult.none);
    });
    _connectivity.checkConnectivity().then((result) {
      _controller.add(result != ConnectivityResult.none);
    });
  }

  Stream<bool> get isConnected {
    _stream ??= _controller.stream;
    return _stream!;
  }

  void dispose() {
    _subscription.cancel();
    _controller.close();
  }
}
