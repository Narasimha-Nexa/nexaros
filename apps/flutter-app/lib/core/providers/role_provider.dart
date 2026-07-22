import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/user_role.dart';
import '../network/api_client.dart';

/// Holds the current user's role, permissions, and identity details
/// decoded from the JWT and enriched from the profile endpoint.
class RoleState {
  final UserRole role;
  final String? userId;
  final String? email;
  final String? name;
  final String? tenantId;
  final String? branchId;
  final bool isAuthenticated;

  const RoleState({
    this.role = UserRole.restaurantOwner,
    this.userId,
    this.email,
    this.name,
    this.tenantId,
    this.branchId,
    this.isAuthenticated = false,
  });

  static const empty = RoleState();

  bool hasPermission(Permission permission) =>
      RolePermissions.hasPermission(role, permission);

  bool hasAnyPermission(List<Permission> permissions) =>
      RolePermissions.hasAnyPermission(role, permissions);

  bool hasAllPermissions(List<Permission> permissions) =>
      RolePermissions.hasAllPermissions(role, permissions);

  String get defaultRoute => RolePermissions.defaultRoute(role);

  RoleState copyWith({
    UserRole? role,
    String? userId,
    String? email,
    String? name,
    String? tenantId,
    String? branchId,
    bool? isAuthenticated,
  }) {
    return RoleState(
      role: role ?? this.role,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      name: name ?? this.name,
      tenantId: tenantId ?? this.tenantId,
      branchId: branchId ?? this.branchId,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

/// Provides the current user's role and permissions across the app.
///
/// Decodes the JWT to extract the user's role and fetches the profile
/// to enrich with user details. Exposes [RoleState] which Compares
/// against the [Permission] and [UserRole] models.
///
/// Wire this into [MultiProvider] in main.dart so all screens
/// and widgets can access it via `context.watch<RoleProvider>()`.
class RoleProvider extends ChangeNotifier {
  final ApiClient _api;
  RoleState _state = RoleState.empty;

  RoleProvider(this._api);

  RoleState get state => _state;
  UserRole get role => _state.role;
  bool get isAuthenticated => _state.isAuthenticated;

  /// Decode role from a JWT without verification (client-side only).
  /// The actual JWT verification happens on the backend.
  UserRole _decodeRoleFromToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length < 2) return UserRole.restaurantOwner;

      // Base64 decode the payload (second part)
      final payload = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final claims = jsonDecode(payload) as Map<String, dynamic>;

      // Try multiple claim keys for role
      final roleStr = (claims['role'] ??
              claims['userRole'] ??
              claims['UserRole'] ??
              '')
          .toString();
      return UserRole.fromString(roleStr);
    } catch (_) {
      return UserRole.restaurantOwner;
    }
  }

  /// Initialize role state from the stored JWT and profile.
  /// Call this after login or app startup.
  Future<void> initialize() async {
    final token = _api.accessToken;
    if (token == null) {
      _state = RoleState.empty;
      notifyListeners();
      return;
    }

    // Decode role from JWT
    final decodedRole = _decodeRoleFromToken(token);

    // Try fetching profile for enriched details
    try {
      final profile = await _api.getProfile();
      final user = profile['user'] as Map<String, dynamic>? ?? profile;
      final tenant = profile['tenant'] as Map<String, dynamic>?;

      _state = RoleState(
        role: decodedRole,
        userId: user['id']?.toString(),
        email: user['email']?.toString(),
        name: '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim(),
        tenantId: tenant?['id']?.toString(),
        branchId: _api.branchId,
        isAuthenticated: true,
      );
    } catch (_) {
      // Fallback: use JWT-decoded role only
      _state = RoleState(
        role: decodedRole,
        branchId: _api.branchId,
        isAuthenticated: true,
      );
    }

    notifyListeners();
  }

  /// Set role state directly from login response data.
  /// Called immediately after successful login before profile fetch.
  void setFromLogin(Map<String, dynamic> data, String token) {
    final decodedRole = _decodeRoleFromToken(token);
    final user = data['user'] as Map<String, dynamic>? ?? data;
    final tenant = data['tenant'] as Map<String, dynamic>?;

    _state = RoleState(
      role: decodedRole,
      userId: user['id']?.toString(),
      email: user['email']?.toString(),
      name: '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim(),
      tenantId: tenant?['id']?.toString(),
      branchId: _api.branchId,
      isAuthenticated: true,
    );
    notifyListeners();
  }

  /// Reset role state on logout.
  void reset() {
    _state = RoleState.empty;
    notifyListeners();
  }

  // ── Convenience permission checks ──

  bool can(Permission permission) => _state.hasPermission(permission);
  bool canAny(List<Permission> permissions) =>
      _state.hasAnyPermission(permissions);
  bool canAll(List<Permission> permissions) =>
      _state.hasAllPermissions(permissions);

  /// Check if the current role matches any of the given roles.
  bool isRole(List<UserRole> roles) => roles.contains(_state.role);

  /// Check if the current role is at or above the given level.
  /// Hierarchy: superAdmin > owner > manager > rest
  bool isAtLeast(UserRole minimum) {
    const hierarchy = [
      UserRole.support,
      UserRole.deliveryPartner,
      UserRole.kitchenStaff,
      UserRole.waiter,
      UserRole.cashier,
      UserRole.chef,
      UserRole.inventoryManager,
      UserRole.accountant,
      UserRole.hr,
      UserRole.marketing,
      UserRole.branchManager,
      UserRole.restaurantOwner,
      UserRole.superAdmin,
    ];
    final currentIdx = hierarchy.indexOf(_state.role);
    final minIdx = hierarchy.indexOf(minimum);
    return currentIdx >= minIdx;
  }
}
