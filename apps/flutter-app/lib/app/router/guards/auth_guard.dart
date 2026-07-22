import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../features/auth/providers/auth_provider.dart';

/// Redirects to /login if the user is not authenticated.
/// Also handles the initial loading state and tenant detection.
class AuthGuard extends ChangeNotifier {
  final AuthProvider _authProvider;

  AuthGuard(this._authProvider) {
    _authProvider.addListener(_onAuthChange);
  }

  final ValueNotifier<bool> isReady = ValueNotifier(false);

  void _onAuthChange() {
    if (_authProvider.state.status != AuthStatus.initial &&
        _authProvider.state.status != AuthStatus.loading) {
      isReady.value = true;
    }
  }

  Future<void> initialize() async {
    await _authProvider.checkAuth();
    isReady.value = true;
  }

  String? redirect(BuildContext context, GoRouterState state) {
    final authStatus = _authProvider.state.status;
    final isLoginRoute = state.matchedLocation == '/login';

    if (authStatus == AuthStatus.authenticated) {
      // Redirect away from login if already authenticated
      if (isLoginRoute) {
        return '/shell/dashboard';
      }
      return null; // Allow access
    }

    // Not authenticated — redirect to login (unless already there)
    if (!isLoginRoute) {
      return '/login';
    }

    return null; // Already on login
  }

  @override
  void dispose() {
    _authProvider.removeListener(_onAuthChange);
    super.dispose();
  }
}
