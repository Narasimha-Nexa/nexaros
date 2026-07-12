import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:async';

class ConnectivityMonitor {
  final _connectivity = Connectivity();
  StreamController<bool>? _controller;
  StreamSubscription? _subscription;

  Stream<bool> get isConnected {
    _controller = StreamController<bool>.broadcast();
    _subscription = _connectivity.onConnectivityChanged.listen((result) {
      _controller!.add(result != ConnectivityResult.none);
    });

    // Check initial state
    _connectivity.checkConnectivity().then((result) {
      _controller!.add(result != ConnectivityResult.none);
    });

    return _controller!.stream;
  }

  void dispose() {
    _subscription?.cancel();
    _controller?.close();
  }
}
