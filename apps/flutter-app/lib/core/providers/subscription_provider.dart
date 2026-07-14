import 'dart:async';
import 'package:flutter/material.dart';
import '../network/api_client.dart';

class SubscriptionInfo {
  final String status;
  final Map<String, bool> entitlements;
  final String? plan;
  final DateTime? trialEndsAt;
  final DateTime? currentPeriodEnd;
  final int gracePeriodDays;
  final bool hasPromise;
  final DateTime? promiseUntil;

  const SubscriptionInfo({
    required this.status,
    required this.entitlements,
    this.plan,
    this.trialEndsAt,
    this.currentPeriodEnd,
    this.gracePeriodDays = 7,
    this.hasPromise = false,
    this.promiseUntil,
  });

  factory SubscriptionInfo.empty() => const SubscriptionInfo(
    status: 'NONE',
    entitlements: {},
  );

  bool get isActive => status == 'ACTIVE' || status == 'TRIAL';
  bool get isTrial => status == 'TRIAL';
  bool get isGracePeriod => status == 'GRACE_PERIOD';
  bool get isRestricted => status == 'RESTRICTED';
  bool get isSuspended => status == 'SUSPENDED';
  bool get isPaymentPending => status == 'PAYMENT_PENDING';
  bool get isNone => status == 'NONE';

  bool get canOperate =>
      status == 'ACTIVE' ||
      status == 'TRIAL' ||
      status == 'PAYMENT_PENDING' ||
      status == 'GRACE_PERIOD' ||
      status == 'RESTRICTED';

  int? get daysUntilExpiry {
    if (currentPeriodEnd != null) {
      final diff = currentPeriodEnd!.difference(DateTime.now()).inDays;
      return diff >= 0 ? diff : 0;
    }
    if (isTrial && trialEndsAt != null) {
      final diff = trialEndsAt!.difference(DateTime.now()).inDays;
      return diff >= 0 ? diff : 0;
    }
    return null;
  }

  int? get graceDaysRemaining {
    if (!isGracePeriod || gracePeriodDays <= 0) return null;
    final diff = daysUntilExpiry;
    if (diff != null && diff <= gracePeriodDays) return diff;
    return null;
  }

  bool isModuleEnabled(String moduleKey) {
    return entitlements[moduleKey] ?? false;
  }

  String get statusLabel {
    switch (status) {
      case 'ACTIVE': return 'Active';
      case 'TRIAL': return 'Free Trial';
      case 'PAYMENT_PENDING': return 'Payment Pending';
      case 'GRACE_PERIOD': return 'Grace Period';
      case 'RESTRICTED': return 'Restricted';
      case 'SUSPENDED': return 'Suspended';
      case 'ARCHIVED': return 'Archived';
      default: return 'No Subscription';
    }
  }

  Color get statusColor {
    switch (status) {
      case 'ACTIVE': return const Color(0xFF10B981);
      case 'TRIAL': return const Color(0xFF3B82F6);
      case 'PAYMENT_PENDING': return const Color(0xFFF59E0B);
      case 'GRACE_PERIOD': return const Color(0xFFF97316);
      case 'RESTRICTED': return const Color(0xFFEF4444);
      case 'SUSPENDED': return const Color(0xFF6B7280);
      default: return const Color(0xFF94A3B8);
    }
  }

  IconData get statusIcon {
    switch (status) {
      case 'ACTIVE': return Icons.check_circle;
      case 'TRIAL': return Icons.star;
      case 'PAYMENT_PENDING': return Icons.payment;
      case 'GRACE_PERIOD': return Icons.warning;
      case 'RESTRICTED': return Icons.lock;
      case 'SUSPENDED': return Icons.block;
      default: return Icons.help_outline;
    }
  }

  String get gracePeriodMessage {
    final days = graceDaysRemaining;
    if (days == null) return '';
    if (days == 0) return 'Grace period ends today. Renew now to avoid service restrictions.';
    return 'You have $days day${days == 1 ? '' : 's'} left in grace period. Renew to keep full access.';
  }

  String get trialMessage {
    final days = daysUntilExpiry;
    if (days == null) return '';
    if (days == 0) return 'Free trial ends today. Upgrade now to continue using all features.';
    if (days == 1) return 'Free trial ends tomorrow. Upgrade to keep all features.';
    return 'Free trial ends in $days days. Upgrade to keep all features.';
  }

  String get restrictedMessage {
    return 'Your subscription has expired. Core features (POS, Orders, Kitchen, Tables, Payments) are available. '
        'Upgrade to unlock all features.';
  }

  SubscriptionInfo copyWith({
    String? status,
    Map<String, bool>? entitlements,
    String? plan,
    DateTime? trialEndsAt,
    DateTime? currentPeriodEnd,
    int? gracePeriodDays,
    bool? hasPromise,
    DateTime? promiseUntil,
  }) {
    return SubscriptionInfo(
      status: status ?? this.status,
      entitlements: entitlements ?? this.entitlements,
      plan: plan ?? this.plan,
      trialEndsAt: trialEndsAt ?? this.trialEndsAt,
      currentPeriodEnd: currentPeriodEnd ?? this.currentPeriodEnd,
      gracePeriodDays: gracePeriodDays ?? this.gracePeriodDays,
      hasPromise: hasPromise ?? this.hasPromise,
      promiseUntil: promiseUntil ?? this.promiseUntil,
    );
  }
}

class SubscriptionProvider extends ChangeNotifier {
  final ApiClient _api;
  SubscriptionInfo _info = SubscriptionInfo.empty();
  bool _isLoading = false;
  String? _error;
  Timer? _refreshTimer;

  SubscriptionProvider(this._api);

  SubscriptionInfo get info => _info;
  bool get isLoading => _isLoading;
  String? get error => _error;

  bool isModuleEnabled(String moduleKey) => _info.isModuleEnabled(moduleKey);

  bool canAccessFeature(String moduleKey) {
    if (_info.isActive) return _info.isModuleEnabled(moduleKey);
    if (_info.isGracePeriod || _info.isPaymentPending) return true;
    if (_info.isRestricted) return _info.isModuleEnabled(moduleKey);
    return false;
  }

  String getModuleLockReason(String moduleKey) {
    if (_info.isNone) return 'No active subscription. Please sign up to access this feature.';
    if (_info.isSuspended) return 'Your subscription is suspended. Please contact support to reactivate.';
    if (_info.isRestricted && !_info.isModuleEnabled(moduleKey)) {
      return 'This feature requires an active subscription. Please upgrade to access it.';
    }
    if (_info.isGracePeriod) return 'Your subscription is in grace period. Please renew to continue full access.';
    if (_info.isPaymentPending) return 'Payment is pending. Please complete payment to avoid service interruption.';
    return '';
  }

  String get statusLabel => _info.statusLabel;
  Color get statusColor => _info.statusColor;
  IconData get statusIcon => _info.statusIcon;
  String get gracePeriodMessage => _info.gracePeriodMessage;
  String get trialMessage => _info.trialMessage;
  String get restrictedMessage => _info.restrictedMessage;

  Future<void> loadEntitlements() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final tenantId = _api.branchId;
      if (tenantId == null) {
        _info = SubscriptionInfo.empty();
        _isLoading = false;
        notifyListeners();
        return;
      }

      final response = await _api.requestWithRetry(
        () => _api.getEntitlements(tenantId),
      );

      final entitlementsMap = <String, bool>{};
      final entData = response['entitlements'];
      if (entData is Map) {
        entData.forEach((key, value) {
          entitlementsMap[key.toString()] = value == true;
        });
      }

      _info = SubscriptionInfo(
        status: response['status'] ?? 'NONE',
        entitlements: entitlementsMap,
        plan: response['plan'],
        trialEndsAt: response['trialEndsAt'] != null
            ? DateTime.tryParse(response['trialEndsAt'])
            : null,
        currentPeriodEnd: response['currentPeriodEnd'] != null
            ? DateTime.tryParse(response['currentPeriodEnd'])
            : null,
        gracePeriodDays: response['gracePeriodDays'] ?? 7,
        hasPromise: response['hasPromise'] ?? false,
        promiseUntil: response['promiseUntil'] != null
            ? DateTime.tryParse(response['promiseUntil'])
            : null,
      );
    } catch (e) {
      _error = e.toString();
      _info = SubscriptionInfo.empty();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void startPeriodicRefresh({Duration interval = const Duration(minutes: 30)}) {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(interval, (_) => loadEntitlements());
  }

  void stopPeriodicRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  @override
  void dispose() {
    stopPeriodicRefresh();
    super.dispose();
  }
}
