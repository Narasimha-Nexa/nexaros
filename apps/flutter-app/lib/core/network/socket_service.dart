import 'package:socket_io_client/socket_io_client.dart';

class SocketService {
  Socket? _socket;
  String? _baseUrl;
  String? _token;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;

  void connect(String baseUrl, String token) {
    _baseUrl = baseUrl;
    _token = token;
    _reconnectAttempts = 0;
    _doConnect();
  }

  final List<String> _rooms = [];

  void _doConnect() {
    if (_baseUrl == null || _token == null) return;

    _socket = io(
      _baseUrl!,
      OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionAttempts(_maxReconnectAttempts)
          .setAuth({'token': _token})
          .build(),
    );

    _socket!.onConnect((_) {
      _reconnectAttempts = 0;
      // Re-join all previously joined rooms after reconnect
      for (final room in _rooms) {
        _socket?.emit('join:branch', {'branchId': room});
      }
    });

    _socket!.onDisconnect((_) {
      _reconnectAttempts++;
      if (_reconnectAttempts < _maxReconnectAttempts && _baseUrl != null && _token != null) {
        Future.delayed(Duration(seconds: 2 * _reconnectAttempts), () {
          if (_socket != null && !_socket!.connected) {
            _doConnect();
          }
        });
      }
    });

    _socket!.onConnectError((error) {
      _reconnectAttempts++;
    });
  }

  void joinBranch(String branchId) {
    if (!_rooms.contains(branchId)) {
      _rooms.add(branchId);
    }
    _socket?.emit('join:branch', {'branchId': branchId});
  }

  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  void off(String event) {
    _socket?.off(event);
  }

  bool get isConnected => _socket?.connected ?? false;

  void disconnect() {
    _reconnectAttempts = _maxReconnectAttempts;
    _rooms.clear();
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
