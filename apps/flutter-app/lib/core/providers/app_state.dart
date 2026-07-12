import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/socket_service.dart';

class AppState extends ChangeNotifier {
  final ApiClient api = ApiClient();
  final SocketService socket = SocketService();
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void onLogin(String branchId) {
    final token = api.accessToken;
    if (token != null) {
      socket.connect(api.baseUrl, token);
      socket.joinBranch(branchId);
    }
    _isConnected = true;
    notifyListeners();
  }

  void onLogout() {
    socket.disconnect();
    _isConnected = false;
    notifyListeners();
  }

  void listenToEvent(String event, Function(dynamic) callback) {
    socket.on(event, callback);
  }

  void removeSocketListener(String event) {
    socket.off(event);
  }
}
