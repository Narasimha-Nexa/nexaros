import 'dart:async';
import 'package:flutter/services.dart';

class BarcodeScannerService {
  static const _channel = MethodChannel('com.nexaros/barcode');
  final StreamController<String> _controller = StreamController<String>.broadcast();
  Stream<String> get onScan => _controller.stream;
  bool _isListening = false;

  BarcodeScannerService() {
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onBarcodeScanned') {
        final code = call.arguments as String;
        _controller.add(code);
      }
    });
  }

  Future<void> startListening() async {
    if (_isListening) return;
    try {
      await _channel.invokeMethod('startBarcodeListener');
      _isListening = true;
    } catch (_) {
      // Platform not available (desktop/web)
    }
  }

  Future<void> stopListening() async {
    if (!_isListening) return;
    try {
      await _channel.invokeMethod('stopBarcodeListener');
      _isListening = false;
    } catch (_) {}
  }

  /// For HID scanners that act as keyboard input,
  /// use a FocusNode + RawKeyboardListener instead.
  /// This method provides a simulated scan for testing.
  void simulateScan(String barcode) {
    _controller.add(barcode);
  }

  void dispose() {
    stopListening();
    _controller.close();
  }
}
