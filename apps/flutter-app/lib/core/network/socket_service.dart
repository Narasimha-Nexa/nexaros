import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  IO.Socket? _socket;

  void connect(String baseUrl, String token) {
    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    _socket!.onConnect((_) {
      print('[WS] Connected to server');
    });

    _socket!.onDisconnect((_) {
      print('[WS] Disconnected from server');
    });

    _socket!.onConnectError((error) {
      print('[WS] Connection error: $error');
    });
  }

  void joinBranch(String branchId) {
    _socket?.emit('join:branch', {'branchId': branchId});
  }

  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  void off(String event) {
    _socket?.off(event);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
  }
}
