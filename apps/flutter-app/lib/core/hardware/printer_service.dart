import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'esc_pos_builder.dart';

/// Represents a discovered network printer
class DiscoveredPrinter {
  final String ip;
  final int port;
  final int responseTimeMs;

  DiscoveredPrinter({
    required this.ip,
    required this.port,
    required this.responseTimeMs,
  });

  @override
  String toString() => '$ip:$port (${responseTimeMs}ms)';
}

class PrinterService {
  static const _prefKeyPrinterIp = 'printer_ip';
  static const _prefKeyPrinterPort = 'printer_port';
  static const _prefKeyPrinterType = 'printer_type'; // 'network' or 'usb'
  static const _prefKeyKotPrinterIp = 'kot_printer_ip';
  static const _prefKeyKotPrinterPort = 'kot_printer_port';

  PrinterType _printerType = PrinterType.network;
  String _printerIp = '192.168.1.100';
  int _printerPort = 9100;
  String _kotPrinterIp = '192.168.1.101';
  int _kotPrinterPort = 9100;

  PrinterType get printerType => _printerType;
  String get printerIp => _printerIp;
  int get printerPort => _printerPort;
  String get kotPrinterIp => _kotPrinterIp;
  int get kotPrinterPort => _kotPrinterPort;

  Future<void> loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _printerType = PrinterType.values[prefs.getInt(_prefKeyPrinterType) ?? 0];
    _printerIp = prefs.getString(_prefKeyPrinterIp) ?? '192.168.1.100';
    _printerPort = prefs.getInt(_prefKeyPrinterPort) ?? 9100;
    _kotPrinterIp = prefs.getString(_prefKeyKotPrinterIp) ?? '192.168.1.101';
    _kotPrinterPort = prefs.getInt(_prefKeyKotPrinterPort) ?? 9100;
  }

  Future<void> saveSettings({
    PrinterType? type,
    String? ip,
    int? port,
    String? kotIp,
    int? kotPort,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    if (type != null) {
      _printerType = type;
      await prefs.setInt(_prefKeyPrinterType, type.index);
    }
    if (ip != null) {
      _printerIp = ip;
      await prefs.setString(_prefKeyPrinterIp, ip);
    }
    if (port != null) {
      _printerPort = port;
      await prefs.setInt(_prefKeyPrinterPort, port);
    }
    if (kotIp != null) {
      _kotPrinterIp = kotIp;
      await prefs.setString(_prefKeyKotPrinterIp, kotIp);
    }
    if (kotPort != null) {
      _kotPrinterPort = kotPort;
      await prefs.setInt(_prefKeyKotPrinterPort, kotPort);
    }
  }

  Future<bool> printReceipt(Uint8List data) async {
    if (_printerType == PrinterType.network) {
      return _sendToNetworkPrinter(_printerIp, _printerPort, data);
    }
    // USB printing requires platform channel (android/ios specific)
    return _sendToUsbPrinter(data);
  }

  Future<bool> printKot(Uint8List data) async {
    if (_printerType == PrinterType.network) {
      return _sendToNetworkPrinter(_kotPrinterIp, _kotPrinterPort, data);
    }
    return _sendToUsbPrinter(data);
  }

  Future<bool> openCashDrawer() async {
    // ESC/POS command to open cash drawer: ESC p 0 25 250
    final data = Uint8List.fromList([0x1B, 0x70, 0x00, 0x19, 0xFA]);
    if (_printerType == PrinterType.network) {
      return _sendToNetworkPrinter(_printerIp, _printerPort, data);
    }
    return _sendToUsbPrinter(data);
  }

  Future<bool> testPrinter() async {
    final receipt = EscPosBuilder()
        .text('NexaROS', center: true, bold: true, large: true)
        .divider()
        .text('Printer Test', center: true)
        .text('${DateTime.now()}', center: true)
        .divider()
        .text('If you can see this,')
        .text('your printer is working!')
        .divider()
        .text('Network: $_printerIp:$_printerPort', center: true)
        .build();
    return printReceipt(receipt);
  }

  Future<bool> testKotPrinter() async {
    final receipt = EscPosBuilder()
        .text('KOT PRINTER TEST', center: true, bold: true)
        .divider()
        .text('Kitchen Printer', center: true)
        .text('IP: $_kotPrinterIp:$_kotPrinterPort', center: true)
        .divider()
        .build();
    return printKot(receipt);
  }

  Future<bool> _sendToNetworkPrinter(String ip, int port, Uint8List data) async {
    try {
      final socket = await Socket.connect(ip, port, timeout: const Duration(seconds: 5));
      socket.add(data);
      await socket.flush();
      await socket.close();
      return true;
    } catch (e) {
      debugPrint('Printer error: $e');
      return false;
    }
  }

  Future<bool> _sendToUsbPrinter(Uint8List data) async {
    // USB printing requires platform-specific implementation
    // For now, log the data and return false
    debugPrint('USB printing not yet implemented. Data length: ${data.length}');
    return false;
  }

  Future<bool> checkPrinterConnection() async {
    try {
      final socket = await Socket.connect(_printerIp, _printerPort, timeout: const Duration(seconds: 3));
      await socket.close();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> checkKotPrinterConnection() async {
    try {
      final socket = await Socket.connect(_kotPrinterIp, _kotPrinterPort, timeout: const Duration(seconds: 3));
      await socket.close();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Auto-detect network printers on the local subnet
  /// Scans common IPs on port 9100 (standard ESC/POS port)
  Future<List<DiscoveredPrinter>> discoverPrinters() async {
    final discovered = <DiscoveredPrinter>[];
    final subnets = ['192.168.1.', '192.168.0.', '10.0.0.'];
    final semaphore = Semaphore(10); // Limit concurrent connections

    final futures = <Future<void>>[];

    for (final subnet in subnets) {
      for (int i = 1; i <= 254; i++) {
        final ip = '$subnet$i';
        futures.add(_tryConnectPrinter(ip, 9100, discovered, semaphore));
      }
    }

    // Wait for all scans to complete with timeout
    try {
      await Future.wait(futures).timeout(const Duration(seconds: 15));
    } catch (_) {
      // Timeout or connection errors are acceptable
    }

    // Sort by response time (fastest first)
    discovered.sort((a, b) => a.responseTimeMs.compareTo(b.responseTimeMs));
    return discovered;
  }

  Future<void> _tryConnectPrinter(
    String ip,
    int port,
    List<DiscoveredPrinter> discovered,
    Semaphore semaphore,
  ) async {
    await semaphore.acquire();
    try {
      final stopwatch = Stopwatch()..start();
      final socket = await Socket.connect(ip, port, timeout: const Duration(seconds: 1));
      await socket.close();
      stopwatch.stop();
      discovered.add(DiscoveredPrinter(
        ip: ip,
        port: port,
        responseTimeMs: stopwatch.elapsedMilliseconds,
      ));
    } catch (_) {
      // Not a printer at this address
    } finally {
      semaphore.release();
    }
  }

  /// Measure network latency to printer
  Future<int> measureLatency(String ip, int port) async {
    try {
      final stopwatch = Stopwatch()..start();
      final socket = await Socket.connect(ip, port, timeout: const Duration(seconds: 2));
      await socket.close();
      stopwatch.stop();
      return stopwatch.elapsedMilliseconds;
    } catch (_) {
      return -1;
    }
  }
}

/// Simple semaphore for concurrency control
/// Simple semaphore for concurrency control (polling-based)
class Semaphore {
  final int _max;
  int _acquired = 0;

  Semaphore(this._max);

  Future<void> acquire() async {
    if (_acquired < _max) {
      _acquired++;
      return;
    }
    await Future.delayed(const Duration(milliseconds: 50));
    return acquire();
  }

  void release() {
    _acquired--;
  }
}

enum PrinterType { network, usb }
