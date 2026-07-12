import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

enum AuthStatus { initial, authenticated, unauthenticated, loading, error }

class AuthState {
  final AuthStatus status;
  final String? error;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? tenant;

  const AuthState({
    this.status = AuthStatus.initial,
    this.error,
    this.user,
    this.tenant,
  });

  AuthState copyWith({
    AuthStatus? status,
    String? error,
    Map<String, dynamic>? user,
    Map<String, dynamic>? tenant,
  }) {
    return AuthState(
      status: status ?? this.status,
      error: error,
      user: user ?? this.user,
      tenant: tenant ?? this.tenant,
    );
  }
}

class AuthProvider extends ChangeNotifier {
  final ApiClient _api;
  AuthState _state = const AuthState();

  AuthProvider(this._api);

  AuthState get state => _state;

  Future<void> checkAuth() async {
    _state = _state.copyWith(status: AuthStatus.loading);
    notifyListeners();

    final hasToken = await _api.hasValidSession();
    if (!hasToken) {
      _state = _state.copyWith(status: AuthStatus.unauthenticated);
      notifyListeners();
      return;
    }

    try {
      final profile = await _api.getProfile();
      _state = _state.copyWith(
        status: AuthStatus.authenticated,
        user: profile['user'] ?? profile,
        tenant: profile['tenant'],
      );
    } catch (_) {
      _state = _state.copyWith(status: AuthStatus.unauthenticated);
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    _state = _state.copyWith(status: AuthStatus.loading, error: null);
    notifyListeners();

    try {
      final data = await _api.login(email, password);
      _state = _state.copyWith(
        status: AuthStatus.authenticated,
        user: data['user'],
        tenant: data['tenant'],
      );
    } catch (e) {
      _state = _state.copyWith(
        status: AuthStatus.error,
        error: e.toString().replaceAll('Exception: ', ''),
      );
    }
    notifyListeners();
  }

  Future<void> logout() async {
    await _api.logout();
    _state = const AuthState(status: AuthStatus.unauthenticated);
    notifyListeners();
  }
}
