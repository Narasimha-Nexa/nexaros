/// Defines all roles in the NexaROS system.
/// Each role maps to a set of permissions that control access
/// to screens, actions, and data across the entire application.
enum UserRole {
  superAdmin,
  restaurantOwner,
  branchManager,
  cashier,
  waiter,
  chef,
  kitchenStaff,
  inventoryManager,
  deliveryPartner,
  accountant,
  hr,
  marketing,
  support;

  String get label {
    switch (this) {
      case UserRole.superAdmin:
        return 'Super Admin';
      case UserRole.restaurantOwner:
        return 'Owner';
      case UserRole.branchManager:
        return 'Branch Manager';
      case UserRole.cashier:
        return 'Cashier';
      case UserRole.waiter:
        return 'Waiter';
      case UserRole.chef:
        return 'Chef';
      case UserRole.kitchenStaff:
        return 'Kitchen Staff';
      case UserRole.inventoryManager:
        return 'Inventory Manager';
      case UserRole.deliveryPartner:
        return 'Delivery Partner';
      case UserRole.accountant:
        return 'Accountant';
      case UserRole.hr:
        return 'HR';
      case UserRole.marketing:
        return 'Marketing';
      case UserRole.support:
        return 'Support';
    }
  }

  static UserRole fromString(String value) {
    return UserRole.values.firstWhere(
      (r) => r.name == value || r.label == value,
      orElse: () => UserRole.restaurantOwner,
    );
  }
}

/// Permission keys for fine-grained access control.
/// Every screen, button, and action should check against these.
enum Permission {
  // ── Dashboard ──
  viewDashboard,
  viewRevenueAnalytics,
  viewOrderAnalytics,
  viewCustomerAnalytics,
  viewInventoryAnalytics,

  // ── Orders ──
  viewOrders,
  createOrder,
  modifyOrder,
  cancelOrder,
  viewAllOrders,
  processRefund,

  // ── POS ──
  usePOS,
  acceptPayment,
  splitBill,
  applyDiscount,
  applyCoupon,
  voidTransaction,

  // ── Menu ──
  viewMenu,
  manageMenuCategories,
  manageMenuItems,
  updatePrices,
  toggleAvailability,
  manageCombos,

  // ── Kitchen ──
  viewKDS,
  acceptOrder,
  markItemPreparing,
  markItemReady,
  markOrderComplete,
  reorderPriority,

  // ── Inventory ──
  viewInventory,
  manageInventory,
  createPurchaseOrder,
  approvePurchaseOrder,
  manageSuppliers,
  trackWaste,
  receiveStock,

  // ── Staff ──
  viewStaff,
  manageStaff,
  manageRoles,
  viewAttendance,
  manageAttendance,
  manageShifts,
  approveLeave,
  processPayroll,

  // ── Reservations ──
  viewReservations,
  manageReservations,
  manageTableLayout,

  // ── CRM ──
  viewCustomers,
  manageCustomers,
  manageLoyaltyProgram,
  manageWallet,
  viewFeedback,
  manageCampaigns,

  // ── Finance ──
  viewFinance,
  viewSalesReports,
  viewExpenses,
  manageExpenses,
  viewTaxReports,
  exportFinancialData,
  viewPAndL,

  // ── Reports ──
  viewReports,
  generateReport,
  scheduleReport,
  exportReport,

  // ── Delivery ──
  viewDeliveryQueue,
  acceptDelivery,
  trackDeliveryGPS,
  verifyDeliveryOTP,

  // ── Settings ──
  viewSettings,
  manageBranches,
  manageUsers,
  managePaymentGateway,
  managePrinter,
  manageTaxes,
  manageNotifications,
  manageIntegrations,

  // ── Website / CMS ──
  manageWebsite,
  manageHeroBanner,
  manageSEO,
  manageTheme,

  // ── Subscription ──
  viewSubscription,
  manageSubscription,
  manageCoupons,

  // ── AI ──
  viewAIAnalytics,
  useAIChat,
  manageAISettings,

  // ── Audit ──
  viewAuditLogs,
  exportAuditLogs,
}

/// Maps roles to their granted permissions.
/// Owner gets all permissions by default.
class RolePermissions {
  static const Map<UserRole, List<Permission>> _permissions = {
    UserRole.superAdmin: Permission.values,
    UserRole.restaurantOwner: Permission.values,
    UserRole.branchManager: [
      Permission.viewDashboard,
      Permission.viewRevenueAnalytics,
      Permission.viewOrderAnalytics,
      Permission.viewCustomerAnalytics,
      Permission.viewInventoryAnalytics,
      Permission.viewOrders,
      Permission.createOrder,
      Permission.modifyOrder,
      Permission.cancelOrder,
      Permission.viewAllOrders,
      Permission.processRefund,
      Permission.usePOS,
      Permission.acceptPayment,
      Permission.splitBill,
      Permission.applyDiscount,
      Permission.applyCoupon,
      Permission.viewMenu,
      Permission.manageMenuCategories,
      Permission.manageMenuItems,
      Permission.updatePrices,
      Permission.toggleAvailability,
      Permission.viewKDS,
      Permission.acceptOrder,
      Permission.viewInventory,
      Permission.manageInventory,
      Permission.createPurchaseOrder,
      Permission.approvePurchaseOrder,
      Permission.manageSuppliers,
      Permission.trackWaste,
      Permission.receiveStock,
      Permission.viewStaff,
      Permission.manageStaff,
      Permission.viewReservations,
      Permission.manageReservations,
      Permission.manageTableLayout,
      Permission.viewCustomers,
      Permission.viewFinance,
      Permission.viewSalesReports,
      Permission.viewReports,
      Permission.generateReport,
      Permission.exportReport,
      Permission.viewSettings,
      Permission.manageBranches,
      Permission.manageUsers,
      Permission.managePrinter,
      Permission.manageTaxes,
      Permission.viewSubscription,
    ],
    UserRole.cashier: [
      Permission.viewDashboard,
      Permission.viewOrders,
      Permission.usePOS,
      Permission.acceptPayment,
      Permission.splitBill,
      Permission.applyDiscount,
      Permission.applyCoupon,
      Permission.voidTransaction,
      Permission.processRefund,
      Permission.viewMenu,
    ],
    UserRole.waiter: [
      Permission.viewOrders,
      Permission.createOrder,
      Permission.modifyOrder,
      Permission.usePOS,
      Permission.acceptPayment,
      Permission.splitBill,
      Permission.viewMenu,
      Permission.viewReservations,
      Permission.viewCustomers,
    ],
    UserRole.chef: [
      Permission.viewKDS,
      Permission.acceptOrder,
      Permission.markItemPreparing,
      Permission.markItemReady,
      Permission.markOrderComplete,
      Permission.reorderPriority,
      Permission.viewMenu,
    ],
    UserRole.kitchenStaff: [
      Permission.viewKDS,
      Permission.acceptOrder,
      Permission.markItemPreparing,
      Permission.markItemReady,
    ],
    UserRole.inventoryManager: [
      Permission.viewInventory,
      Permission.manageInventory,
      Permission.createPurchaseOrder,
      Permission.manageSuppliers,
      Permission.trackWaste,
      Permission.receiveStock,
      Permission.viewReports,
      Permission.exportReport,
    ],
    UserRole.deliveryPartner: [
      Permission.viewDeliveryQueue,
      Permission.acceptDelivery,
      Permission.trackDeliveryGPS,
      Permission.verifyDeliveryOTP,
    ],
    UserRole.accountant: [
      Permission.viewFinance,
      Permission.viewSalesReports,
      Permission.viewExpenses,
      Permission.manageExpenses,
      Permission.viewTaxReports,
      Permission.exportFinancialData,
      Permission.viewPAndL,
      Permission.viewReports,
      Permission.generateReport,
      Permission.scheduleReport,
      Permission.exportReport,
    ],
    UserRole.hr: [
      Permission.viewStaff,
      Permission.manageStaff,
      Permission.viewAttendance,
      Permission.manageAttendance,
      Permission.manageShifts,
      Permission.approveLeave,
      Permission.processPayroll,
    ],
    UserRole.marketing: [
      Permission.viewCustomerAnalytics,
      Permission.viewCustomers,
      Permission.manageCustomers,
      Permission.manageLoyaltyProgram,
      Permission.manageWallet,
      Permission.viewFeedback,
      Permission.manageCampaigns,
      Permission.manageWebsite,
      Permission.manageHeroBanner,
      Permission.manageSEO,
      Permission.manageTheme,
      Permission.viewReports,
      Permission.generateReport,
    ],
    UserRole.support: [
      Permission.viewDashboard,
      Permission.viewOrders,
      Permission.viewCustomers,
      Permission.manageCustomers,
      Permission.viewFeedback,
    ],
  };

  static bool hasPermission(UserRole role, Permission permission) {
    return _permissions[role]?.contains(permission) ?? false;
  }

  static bool hasAnyPermission(UserRole role, List<Permission> permissions) {
    return permissions.any((p) => hasPermission(role, p));
  }

  static bool hasAllPermissions(UserRole role, List<Permission> permissions) {
    return permissions.every((p) => hasPermission(role, p));
  }

  static List<Permission> getPermissionsForRole(UserRole role) {
    return _permissions[role] ?? [];
  }

  /// Returns the default home route for a given role.
  static String defaultRoute(UserRole role) {
    switch (role) {
      case UserRole.chef:
      case UserRole.kitchenStaff:
        return '/shell/kitchen';
      case UserRole.waiter:
        return '/shell/orders';
      case UserRole.cashier:
        return '/shell/pos';
      case UserRole.deliveryPartner:
        return '/shell/delivery';
      case UserRole.inventoryManager:
        return '/shell/inventory';
      default:
        return '/shell/dashboard';
    }
  }
}
