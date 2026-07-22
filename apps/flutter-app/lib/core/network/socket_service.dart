import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart';

/// Connection state for the Socket.IO service.
enum SocketConnectionState { disconnected, connecting, connected, reconnecting }

/// Socket.IO service with presence, typing indicators, and heartbeat.
class SocketService {
  Socket? _socket;
  String? _baseUrl;
  String? _token;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;

  final List<String> _rooms = [];
  Timer? _heartbeatTimer;
  final _connectionStateController =
      StreamController<SocketConnectionState>.broadcast();
  final _presenceController = StreamController<Map<String, dynamic>>.broadcast();
  final _typingController = StreamController<Map<String, dynamic>>.broadcast();

  SocketConnectionState _state = SocketConnectionState.disconnected;
  final Map<String, bool> _presence = {};
  final Set<String> _typingUsers = {};

  Stream<SocketConnectionState> get connectionState =>
      _connectionStateController.stream;
  Stream<Map<String, dynamic>> get presenceEvents =>
      _presenceController.stream;
  Stream<Map<String, dynamic>> get typingEvents => _typingController.stream;
  SocketConnectionState get currentState => _state;
  Map<String, bool> get presence => Map.unmodifiable(_presence);
  Set<String> get typingUsers => Set.unmodifiable(_typingUsers);

  void connect(String baseUrl, String token) {
    _baseUrl = baseUrl;
    _token = token;
    _reconnectAttempts = 0;
    _doConnect();
  }

  void _doConnect() {
    if (_baseUrl == null || _token == null) return;

    _setState(SocketConnectionState.connecting);

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
      _setState(SocketConnectionState.connected);
      _startHeartbeat();
      for (final room in _rooms) {
        _socket?.emit('join:branch', {'branchId': room});
      }
      _socket?.emit('presence:online');
    });

    _socket!.onDisconnect((_) {
      _stopHeartbeat();
      _setState(SocketConnectionState.disconnected);
      _reconnectAttempts++;
      if (_reconnectAttempts < _maxReconnectAttempts &&
          _baseUrl != null &&
          _token != null) {
        _setState(SocketConnectionState.reconnecting);
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

    _socket!.on('presence:update', (data) {
      if (data is Map<String, dynamic>) {
        final userId = data['userId'] as String?;
        final online = data['online'] as bool?;
        if (userId != null && online != null) {
          _presence[userId] = online;
          _presenceController.add(data);
        }
      }
    });

    _socket!.on('typing:update', (data) {
      if (data is Map<String, dynamic>) {
        final userId = data['userId'] as String?;
        final typing = data['typing'] as bool?;
        if (userId != null && typing != null) {
          if (typing) {
            _typingUsers.add(userId);
          } else {
            _typingUsers.remove(userId);
          }
          _typingController.add(data);
        }
      }
    });

    _socket!.on('pong', (_) {
      // Heartbeat acknowledged
    });
  }

  void _setState(SocketConnectionState newState) {
    _state = newState;
    _connectionStateController.add(newState);
  }

  void _startHeartbeat() {
    _stopHeartbeat();
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_socket?.connected == true) {
        _socket?.emit('ping');
      }
    });
  }

  void _stopHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }

  void joinBranch(String branchId) {
    if (!_rooms.contains(branchId)) {
      _rooms.add(branchId);
    }
    _socket?.emit('join:branch', {'branchId': branchId});
  }

  void leaveBranch(String branchId) {
    _rooms.remove(branchId);
    _socket?.emit('leave:branch', {'branchId': branchId});
  }

  void emitTyping(String conversationId, bool isTyping) {
    _socket?.emit('typing:update', {
      'conversationId': conversationId,
      'typing': isTyping,
    });
  }

  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  void off(String event) {
    _socket?.off(event);
  }

  bool get isConnected => _socket?.connected ?? false;

  void disconnect() {
    _stopHeartbeat();
    _reconnectAttempts = _maxReconnectAttempts;
    _rooms.clear();
    _presence.clear();
    _typingUsers.clear();
    _socket?.emit('presence:offline');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _setState(SocketConnectionState.disconnected);
  }

  void dispose() {
    disconnect();
    _connectionStateController.close();
    _presenceController.close();
    _typingController.close();
  }
}
