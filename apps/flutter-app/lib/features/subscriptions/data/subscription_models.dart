enum SubscriptionStatus { active, trial, paymentPending, gracePeriod, restricted, suspended, archived, cancelled, none }

enum BillingCycle { monthly, yearly, quarterly }

SubscriptionStatus subscriptionStatusFromJson(String? v) {
  switch (v) {
    case 'ACTIVE': return SubscriptionStatus.active;
    case 'TRIAL': return SubscriptionStatus.trial;
    case 'PAYMENT_PENDING': return SubscriptionStatus.paymentPending;
    case 'GRACE_PERIOD': return SubscriptionStatus.gracePeriod;
    case 'RESTRICTED': return SubscriptionStatus.restricted;
    case 'SUSPENDED': return SubscriptionStatus.suspended;
    case 'ARCHIVED': return SubscriptionStatus.archived;
    case 'CANCELLED': return SubscriptionStatus.cancelled;
    default: return SubscriptionStatus.none;
  }
}

String subscriptionStatusToJson(SubscriptionStatus s) => s.name.toUpperCase();

BillingCycle billingCycleFromJson(String? v) {
  switch (v) {
    case 'YEARLY': return BillingCycle.yearly;
    case 'QUARTERLY': return BillingCycle.quarterly;
    default: return BillingCycle.monthly;
  }
}

String billingCycleLabel(BillingCycle c) {
  switch (c) {
    case BillingCycle.monthly: return 'Monthly';
    case BillingCycle.yearly: return 'Yearly';
    case BillingCycle.quarterly: return 'Quarterly';
  }
}

class PlanEntitlement {
  final String moduleKey;
  final bool enabled;
  final String? label;

  const PlanEntitlement({required this.moduleKey, required this.enabled, this.label});

  factory PlanEntitlement.fromJson(Map<String, dynamic> json) => PlanEntitlement(
    moduleKey: json['moduleKey'] ?? '',
    enabled: json['enabled'] ?? false,
    label: json['label'],
  );

  Map<String, dynamic> toJson() => {'moduleKey': moduleKey, 'enabled': enabled, if (label != null) 'label': label};
}

class SubscriptionPlan {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final double price;
  final double? yearlyPrice;
  final BillingCycle billingCycle;
  final int trialDays;
  final bool isActive;
  final List<PlanEntitlement> entitlements;
  final int maxBranches;
  final int maxStaff;

  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.price,
    this.yearlyPrice,
    this.billingCycle = BillingCycle.monthly,
    this.trialDays = 14,
    this.isActive = true,
    this.entitlements = const [],
    this.maxBranches = 1,
    this.maxStaff = 10,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => SubscriptionPlan(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    slug: json['slug'] ?? '',
    description: json['description'],
    price: (json['price'] ?? 0).toDouble(),
    yearlyPrice: json['yearlyPrice'] != null ? (json['yearlyPrice'] as num).toDouble() : null,
    billingCycle: billingCycleFromJson(json['billingCycle']),
    trialDays: json['trialDays'] ?? 14,
    isActive: json['isActive'] ?? true,
    entitlements: (json['entitlements'] as List<dynamic>? ?? []).map((e) => PlanEntitlement.fromJson(e as Map<String, dynamic>)).toList(),
    maxBranches: json['maxBranches'] ?? 1,
    maxStaff: json['maxStaff'] ?? 10,
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'name': name, 'slug': slug, 'description': description,
    'price': price, 'yearlyPrice': yearlyPrice,
    'billingCycle': billingCycle.name.toUpperCase(), 'trialDays': trialDays,
    'isActive': isActive, 'maxBranches': maxBranches, 'maxStaff': maxStaff,
    'entitlements': entitlements.map((e) => e.toJson()).toList(),
  };

  List<String> get enabledModuleKeys => entitlements.where((e) => e.enabled).map((e) => e.moduleKey).toList();
  bool isModuleEnabled(String key) => entitlements.any((e) => e.moduleKey == key && e.enabled);
}

class SubscriptionRecord {
  final String id;
  final String tenantId;
  final String? planId;
  final SubscriptionStatus status;
  final Map<String, bool> entitlements;
  final String? planName;
  final double? planPrice;
  final DateTime? trialStartedAt;
  final DateTime? trialEndsAt;
  final DateTime? currentPeriodStart;
  final DateTime? currentPeriodEnd;
  final DateTime? cancelledAt;
  final bool hasPromise;
  final DateTime? promiseUntil;
  final int gracePeriodDays;
  final DateTime createdAt;
  final DateTime updatedAt;

  const SubscriptionRecord({
    required this.id,
    required this.tenantId,
    this.planId,
    required this.status,
    this.entitlements = const {},
    this.planName,
    this.planPrice,
    this.trialStartedAt,
    this.trialEndsAt,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.cancelledAt,
    this.hasPromise = false,
    this.promiseUntil,
    this.gracePeriodDays = 7,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SubscriptionRecord.fromJson(Map<String, dynamic> json) => SubscriptionRecord(
    id: json['id'] ?? '',
    tenantId: json['tenantId'] ?? '',
    planId: json['planId'],
    status: subscriptionStatusFromJson(json['status']),
    entitlements: (json['entitlements'] as Map<String, dynamic>?)?.map((k, v) => MapEntry(k, v == true)) ?? {},
    planName: json['plan']?['name'] ?? json['planName'],
    planPrice: json['plan']?['price'] != null ? (json['plan']['price'] as num).toDouble() : null,
    trialStartedAt: json['trialStartedAt'] != null ? DateTime.tryParse(json['trialStartedAt']) : null,
    trialEndsAt: json['trialEndsAt'] != null ? DateTime.tryParse(json['trialEndsAt']) : null,
    currentPeriodStart: json['currentPeriodStart'] != null ? DateTime.tryParse(json['currentPeriodStart']) : null,
    currentPeriodEnd: json['currentPeriodEnd'] != null ? DateTime.tryParse(json['currentPeriodEnd']) : null,
    cancelledAt: json['cancelledAt'] != null ? DateTime.tryParse(json['cancelledAt']) : null,
    hasPromise: json['hasPromise'] ?? false,
    promiseUntil: json['promiseUntil'] != null ? DateTime.tryParse(json['promiseUntil']) : null,
    gracePeriodDays: json['gracePeriodDays'] ?? 7,
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() : DateTime.now(),
    updatedAt: json['updatedAt'] != null ? DateTime.tryParse(json['updatedAt']) ?? DateTime.now() : DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id': id, 'tenantId': tenantId, 'planId': planId,
    'status': subscriptionStatusToJson(status), 'entitlements': entitlements,
    'planName': planName, 'planPrice': planPrice,
    'trialStartedAt': trialStartedAt?.toIso8601String(),
    'trialEndsAt': trialEndsAt?.toIso8601String(),
    'currentPeriodStart': currentPeriodStart?.toIso8601String(),
    'currentPeriodEnd': currentPeriodEnd?.toIso8601String(),
    'cancelledAt': cancelledAt?.toIso8601String(),
    'hasPromise': hasPromise, 'promiseUntil': promiseUntil?.toIso8601String(),
    'gracePeriodDays': gracePeriodDays,
    'createdAt': createdAt.toIso8601String(), 'updatedAt': updatedAt.toIso8601String(),
  };

  bool get isActive => status == SubscriptionStatus.active || status == SubscriptionStatus.trial;
  bool get isTrial => status == SubscriptionStatus.trial;
  bool get isGracePeriod => status == SubscriptionStatus.gracePeriod;
  bool get isRestricted => status == SubscriptionStatus.restricted;
  bool get isSuspended => status == SubscriptionStatus.suspended;
  bool get isPaymentPending => status == SubscriptionStatus.paymentPending;
  bool get isNone => status == SubscriptionStatus.none;

  bool get canOperate => isActive || isPaymentPending || isGracePeriod || isRestricted;

  bool isModuleEnabled(String moduleKey) => entitlements[moduleKey] ?? false;

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

  String get statusLabel {
    switch (status) {
      case SubscriptionStatus.active: return 'Active';
      case SubscriptionStatus.trial: return 'Free Trial';
      case SubscriptionStatus.paymentPending: return 'Payment Pending';
      case SubscriptionStatus.gracePeriod: return 'Grace Period';
      case SubscriptionStatus.restricted: return 'Restricted';
      case SubscriptionStatus.suspended: return 'Suspended';
      case SubscriptionStatus.archived: return 'Archived';
      case SubscriptionStatus.cancelled: return 'Cancelled';
      default: return 'No Subscription';
    }
  }

  SubscriptionRecord copyWith({
    String? id,
    String? tenantId,
    String? planId,
    SubscriptionStatus? status,
    Map<String, bool>? entitlements,
    String? planName,
    double? planPrice,
    DateTime? trialStartedAt,
    DateTime? trialEndsAt,
    DateTime? currentPeriodStart,
    DateTime? currentPeriodEnd,
    DateTime? cancelledAt,
    bool? hasPromise,
    DateTime? promiseUntil,
    int? gracePeriodDays,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return SubscriptionRecord(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      planId: planId ?? this.planId,
      status: status ?? this.status,
      entitlements: entitlements ?? this.entitlements,
      planName: planName ?? this.planName,
      planPrice: planPrice ?? this.planPrice,
      trialStartedAt: trialStartedAt ?? this.trialStartedAt,
      trialEndsAt: trialEndsAt ?? this.trialEndsAt,
      currentPeriodStart: currentPeriodStart ?? this.currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd ?? this.currentPeriodEnd,
      cancelledAt: cancelledAt ?? this.cancelledAt,
      hasPromise: hasPromise ?? this.hasPromise,
      promiseUntil: promiseUntil ?? this.promiseUntil,
      gracePeriodDays: gracePeriodDays ?? this.gracePeriodDays,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class PaymentRecord {
  final String id;
  final String subscriptionId;
  final double amount;
  final String currency;
  final String status;
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final DateTime? paidAt;
  final DateTime createdAt;

  const PaymentRecord({
    required this.id,
    required this.subscriptionId,
    required this.amount,
    this.currency = 'INR',
    required this.status,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    this.paidAt,
    required this.createdAt,
  });

  factory PaymentRecord.fromJson(Map<String, dynamic> json) => PaymentRecord(
    id: json['id'] ?? '',
    subscriptionId: json['subscriptionId'] ?? '',
    amount: (json['amount'] ?? 0).toDouble(),
    currency: json['currency'] ?? 'INR',
    status: json['status'] ?? 'PENDING',
    razorpayOrderId: json['razorpayOrderId'],
    razorpayPaymentId: json['razorpayPaymentId'],
    paidAt: json['paidAt'] != null ? DateTime.tryParse(json['paidAt']) : null,
    createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) ?? DateTime.now() : DateTime.now(),
  );

  bool get isPaid => status == 'COMPLETED' || status == 'SUCCESS';
  bool get isPending => status == 'PENDING' || status == 'CREATED';
  bool get isFailed => status == 'FAILED' || status == 'CANCELLED';
}

class CouponValidation {
  final String code;
  final String type;
  final double? value;
  final double? discount;
  final String? message;
  final bool isValid;

  const CouponValidation({
    required this.code,
    required this.type,
    this.value,
    this.discount,
    this.message,
    required this.isValid,
  });

  factory CouponValidation.fromJson(Map<String, dynamic> json) => CouponValidation(
    code: json['code'] ?? '',
    type: json['type'] ?? 'FIXED',
    value: json['value'] != null ? (json['value'] as num).toDouble() : null,
    discount: json['discount'] != null ? (json['discount'] as num).toDouble() : null,
    message: json['message'],
    isValid: json['isValid'] ?? json['valid'] ?? true,
  );
}

class SubscriptionOverview {
  final SubscriptionRecord? active;
  final List<SubscriptionRecord> history;
  final List<SubscriptionPlan> plans;
  final int totalPayments;
  final double totalSpent;

  const SubscriptionOverview({
    this.active,
    this.history = const [],
    this.plans = const [],
    this.totalPayments = 0,
    this.totalSpent = 0,
  });

  factory SubscriptionOverview.fromJson(Map<String, dynamic> json) => SubscriptionOverview(
    active: json['active'] != null ? SubscriptionRecord.fromJson(json['active'] as Map<String, dynamic>) : null,
    history: (json['history'] as List<dynamic>? ?? []).map((e) => SubscriptionRecord.fromJson(e as Map<String, dynamic>)).toList(),
    plans: (json['plans'] as List<dynamic>? ?? []).map((e) => SubscriptionPlan.fromJson(e as Map<String, dynamic>)).toList(),
    totalPayments: json['totalPayments'] ?? 0,
    totalSpent: (json['totalSpent'] ?? 0).toDouble(),
  );
}
