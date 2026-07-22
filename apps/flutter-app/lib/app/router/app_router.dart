import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers/riverpod_providers.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/orders/presentation/order_list_screen.dart';
import '../../features/menu/presentation/menu_management_screen.dart';
import '../../features/tables/presentation/table_grid_screen.dart';
import '../../features/pos/presentation/enterprise_pos_screen.dart';
import '../../features/pos/presentation/shift_management_screen.dart';
import '../../features/pos/presentation/refund_screen.dart';
import '../../features/kitchen/presentation/kitchen_display_screen.dart';
import '../../features/kitchen/presentation/kitchen_performance_screen.dart';
import '../../features/kitchen/presentation/kitchen_notifications_screen.dart';
import '../../features/kitchen/presentation/station_management_screen.dart';
import '../../features/kitchen/presentation/chef_management_screen.dart';
import '../../features/kitchen/presentation/course_management_screen.dart';
import '../../features/kitchen/presentation/ai_kitchen_assistant_screen.dart';
import '../../features/staff/presentation/staff_management_screen.dart';
import '../../features/staff/presentation/attendance_screen.dart';
import '../../features/staff/presentation/shift_schedule_screen.dart';
import '../../features/staff/presentation/hr_dashboard_screen.dart';
import '../../features/staff/presentation/employee_management_screen.dart';
import '../../features/staff/presentation/attendance_management_screen.dart' as staff_attendance;
import '../../features/staff/presentation/shift_management_screen.dart' as staff_shift;
import '../../features/staff/presentation/leave_management_screen.dart';
import '../../features/staff/presentation/payroll_management_screen.dart';
import '../../features/staff/presentation/performance_management_screen.dart';
import '../../features/staff/presentation/task_management_screen.dart';
import '../../features/staff/presentation/training_management_screen.dart';
import '../../features/staff/presentation/staff_communication_screen.dart';
import '../../features/staff/presentation/ai_workforce_assistant_screen.dart';
import '../../features/staff/presentation/staff_analytics_screen.dart' as staff_analytics;
import '../../features/inventory/presentation/inventory_management_screen.dart';
import '../../features/inventory/presentation/inventory_dashboard_screen.dart';
import '../../features/inventory/presentation/product_management_screen.dart';
import '../../features/inventory/presentation/warehouse_management_screen.dart';
import '../../features/inventory/presentation/supplier_management_screen.dart';
import '../../features/inventory/presentation/purchase_order_screen.dart';
import '../../features/inventory/presentation/waste_management_screen.dart';
import '../../features/inventory/presentation/recipe_management_screen.dart';
import '../../features/inventory/presentation/stock_counting_screen.dart';
import '../../features/inventory/presentation/transfer_management_screen.dart';
import '../../features/inventory/presentation/batch_expiry_screen.dart';
import '../../features/inventory/presentation/ai_inventory_assistant_screen.dart';
import '../../features/inventory/presentation/inventory_analytics_screen.dart';
import '../../features/delivery/presentation/delivery_dashboard_screen.dart';
import '../../features/delivery/presentation/delivery_partners_screen.dart';
import '../../features/delivery/presentation/delivery_assignment_screen.dart';
import '../../features/delivery/presentation/delivery_tracking_screen.dart';
import '../../features/delivery/presentation/delivery_history_screen.dart';
import '../../features/crm/presentation/customers_screen.dart';
import '../../features/crm/presentation/loyalty_screen.dart';
import '../../features/crm/presentation/reviews_screen.dart';
import '../../features/reservations/presentation/reservation_screen.dart';
import '../../features/subscriptions/presentation/subscription_screen.dart';
import '../../features/subscriptions/presentation/coupon_redemption_screen.dart';
import '../../features/branches/presentation/branch_management_screen.dart';
import '../../features/branches/presentation/staff_branch_assignment_screen.dart';
import '../../features/payments/presentation/payment_screen.dart';
import '../../features/payments/presentation/bill_preview_screen.dart';
import '../../features/settings/presentation/printer_settings_screen.dart';
import '../../features/settings/presentation/printer_diagnostic_screen.dart';
import '../../features/reports/presentation/reports_screen.dart';
import '../../features/analytics/presentation/sales_analytics_screen.dart';
import '../../features/analytics/presentation/customer_analytics_screen.dart';
import '../../features/analytics/presentation/staff_analytics_screen.dart';
import '../../features/analytics/presentation/kitchen_analytics_screen.dart';
import '../../features/analytics/presentation/delivery_analytics_screen.dart';
import '../../features/marketing/presentation/campaign_list_screen.dart';
import '../../features/marketing/presentation/create_campaign_screen.dart';
import '../../features/marketing/presentation/campaign_details_screen.dart';
import '../../features/cms/presentation/website_editor_screen.dart';
import '../../features/cms/presentation/home_sections_screen.dart';
import '../../features/cms/presentation/theme_settings_screen.dart';
import '../../features/cms/presentation/seo_screen.dart';
import '../../features/orders/presentation/order_detail_screen.dart';
import '../../features/orders/presentation/order_dashboard_screen.dart';
import '../../features/pos/presentation/pos_report_screen.dart';
import '../../features/pos/presentation/receipt_preview_screen.dart';
import '../../features/menu/presentation/menu_item_form_screen.dart';
import '../../features/pos/data/pos_models.dart';
import '../../features/inventory/presentation/waste_tracking_screen.dart';
import '../../features/more/presentation/more_grid_screen.dart';
import '../../features/finance/presentation/finance_dashboard_screen.dart';
import '../../features/offers/presentation/coupon_management_screen.dart';
import '../../features/offers/presentation/combo_screen.dart';
import '../../features/finance/presentation/income_screen.dart';
import '../../features/finance/presentation/expense_screen.dart';
import '../../features/finance/presentation/transactions_screen.dart';
import '../../features/finance/presentation/tax_screen.dart';
import '../../features/finance/presentation/invoice_screen.dart';
import '../../features/finance/presentation/finance_reports_screen.dart';
import '../../features/finance/presentation/accounting_screen.dart';
import '../../features/finance/presentation/banking_screen.dart';
import '../../features/finance/presentation/settlement_screen.dart';
import '../../features/finance/presentation/purchase_bills_screen.dart';
import '../../features/finance/presentation/budgeting_screen.dart';
import '../../features/finance/presentation/forecasting_screen.dart';
import '../../features/finance/presentation/ai_finance_assistant_screen.dart';
import '../../features/finance/presentation/financial_analytics_screen.dart';
import '../../features/support/presentation/support_dashboard_screen.dart';
import '../../features/support/presentation/ticket_detail_screen.dart';
import '../../features/support/presentation/create_ticket_screen.dart';
import '../../features/support/presentation/faq_screen.dart';
import '../../features/support/presentation/help_center_screen.dart';
import '../../features/ai_chat/presentation/ai_chat_screen.dart' as old_chat;
import '../../features/ai_platform/presentation/ai_dashboard_screen.dart';
import '../../features/ai_platform/presentation/ai_chat_screen.dart';
import '../../features/ai_platform/presentation/ai_insights_screen.dart';
import '../../features/ai_platform/presentation/ai_reports_screen.dart';
import '../../features/ai_platform/presentation/ai_forecast_screen.dart';
import '../../features/ai_platform/presentation/ai_workflows_screen.dart';
import '../../features/ai_platform/presentation/ai_alerts_screen.dart';
import '../../features/ai_platform/presentation/ai_search_screen.dart';
import '../../features/ai_platform/presentation/ai_settings_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/notifications/presentation/notification_center_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../core/shell/app_shell.dart';

/// Builds the GoRouter configuration for the entire NexaROS app.
///
/// Architecture:
/// - `/login` — public, no auth required
/// - `/shell/*` — authenticated, wrapped in responsive ShellRoute
/// - `/subscription`, `/printer-settings`, `/branches` — accessible modally
///
/// The ShellRoute uses [ResponsiveShell] which picks DesktopShellBuilder,
/// TabletShellBuilder, or MobileShellBuilder based on screen width.
GoRouter createRouter(AuthProvider authNotifier) {
  final router = GoRouter(
    initialLocation: '/login',
    debugLogDiagnostics: true,

    // ── Auth redirect ──
    redirect: (context, state) {
      final container = ProviderScope.containerOf(context, listen: false);
      final auth = container.read(authProvider);
      final authStatus = auth.state.status;
      final isLoginRoute = state.matchedLocation == '/login';

      if (authStatus == AuthStatus.initial || authStatus == AuthStatus.loading) {
        return null;
      }

      if (authStatus == AuthStatus.authenticated) {
        if (isLoginRoute) {
          final roleProv = container.read(roleProvider);
          return roleProv.state.defaultRoute;
        }
        return null;
      }

      if (!isLoginRoute) return '/login';
      return null;
    },
    routes: [
      // ── Public: Login ──
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // ── Public: Subscription (displayed modally from any shell) ──
      GoRoute(
        path: '/subscription',
        name: 'subscription',
        builder: (context, state) {
          return const SubscriptionScreen();
        },
        routes: [
          GoRoute(
            path: 'coupon',
            name: 'coupon-redemption',
            builder: (context, state) {
              final planId = state.uri.queryParameters['planId'] ?? '';
              final planName = state.uri.queryParameters['planName'] ?? '';
              final planPrice = double.tryParse(state.uri.queryParameters['planPrice'] ?? '') ?? 0;
              return CouponRedemptionScreen(
                planId: planId,
                planName: planName,
                planPrice: planPrice,
              );
            },
          ),
        ],
      ),

      // ── Printer settings ──
      GoRoute(
        path: '/printer-settings',
        name: 'printer-settings',
        builder: (context, state) => const PrinterSettingsScreen(),
        routes: [
          GoRoute(
            path: 'diagnostic',
            name: 'printer-diagnostic',
            builder: (context, state) => const PrinterDiagnosticScreen(),
          ),
        ],
      ),

      // ── Public: Branch management ──
      GoRoute(
        path: '/branches',
        name: 'branches',
        builder: (context, state) => const BranchManagementScreen(),
        routes: [
          GoRoute(
            path: 'assign',
            name: 'staff-branch-assignment',
            builder: (context, state) => const StaffBranchAssignmentScreen(),
          ),
        ],
      ),

      // ── Public: Bill preview (shared URL) ──
      GoRoute(
        path: '/bill/:orderId',
        name: 'bill-preview',
        builder: (context, state) => BillPreviewScreen(
          orderId: state.pathParameters['orderId']!,
        ),
      ),

      // ── Authenticated Shell ──
      // Wraps all main app screens in the unified enterprise AppShell
      // which internally selects desktop / tablet / mobile layout.
      ShellRoute(
        builder: (context, state, child) {
          return AppShell(child: child);
        },
        routes: [
          // Dashboard
          GoRoute(
            path: '/shell/dashboard',
            name: 'dashboard',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const DashboardScreen(),
            ),
          ),
          // Orders
          GoRoute(
            path: '/shell/orders',
            name: 'orders',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const OrderListScreen(),
            ),
          ),
          // Menu
          GoRoute(
            path: '/shell/menu',
            name: 'menu',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const MenuManagementScreen(),
            ),
            routes: [
              GoRoute(
                path: 'new',
                name: 'menu-new-item',
                builder: (context, state) => const MenuManagementScreen(),
              ),
              GoRoute(
                path: ':itemId/edit',
                name: 'menu-edit-item',
                builder: (context, state) => const MenuManagementScreen(),
              ),
            ],
          ),
          // Tables
          GoRoute(
            path: '/shell/tables',
            name: 'tables',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const TableGridScreen(),
            ),
          ),
          // POS (Enterprise)
          GoRoute(
            path: '/shell/pos',
            name: 'pos',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const EnterprisePosScreen(),
            ),
          ),
          // Shift Management
          GoRoute(
            path: '/shifts',
            name: 'shifts',
            builder: (context, state) => const ShiftManagementScreen(),
          ),
          // Refund
          GoRoute(
            path: '/refund/:orderId',
            name: 'refund',
            builder: (context, state) {
              final orderId = state.pathParameters['orderId'] ?? '';
              final extra = state.extra as Map<String, dynamic>?;
              return RefundScreen(
                orderId: orderId,
                orderNumber: extra?['orderNumber'],
                maxRefundAmount: (extra?['maxRefundAmount'] ?? 0).toDouble(),
              );
            },
          ),
          // Kitchen Display (KDS)
          GoRoute(
            path: '/shell/kitchen',
            name: 'kitchen',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const KitchenDisplayScreen(),
            ),
            routes: [
              GoRoute(
                path: 'performance',
                name: 'kitchen-performance',
                builder: (context, state) => const KitchenPerformanceScreen(),
              ),
              GoRoute(
                path: 'notifications',
                name: 'kitchen-notifications',
                builder: (context, state) => const KitchenNotificationsScreen(),
              ),
              GoRoute(
                path: 'stations',
                name: 'kitchen-stations',
                builder: (context, state) => const StationManagementScreen(),
              ),
              GoRoute(
                path: 'chefs',
                name: 'kitchen-chefs',
                builder: (context, state) => const ChefManagementScreen(),
              ),
              GoRoute(
                path: 'courses',
                name: 'kitchen-courses',
                builder: (context, state) => const CourseManagementScreen(),
              ),
              GoRoute(
                path: 'ai-assistant',
                name: 'kitchen-ai-assistant',
                builder: (context, state) => const AiKitchenAssistantScreen(),
              ),
            ],
          ),
          // Staff
          GoRoute(
            path: '/shell/staff',
            name: 'staff',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const HrDashboardScreen(),
            ),
            routes: [
              GoRoute(
                path: 'employees',
                name: 'staff-employees',
                pageBuilder: (context, state) => NoTransitionPage(
                  key: state.pageKey,
                  child: const EmployeeManagementScreen(),
                ),
              ),
              GoRoute(
                path: 'attendance',
                name: 'staff-attendance',
                builder: (context, state) => const staff_attendance.AttendanceManagementScreen(),
              ),
              GoRoute(
                path: 'shifts',
                name: 'staff-shifts',
                builder: (context, state) => const staff_shift.ShiftManagementScreen(),
              ),
              GoRoute(
                path: 'leave',
                name: 'staff-leave',
                builder: (context, state) => const LeaveManagementScreen(),
              ),
              GoRoute(
                path: 'payroll',
                name: 'staff-payroll',
                builder: (context, state) => const PayrollManagementScreen(),
              ),
              GoRoute(
                path: 'performance',
                name: 'staff-performance',
                builder: (context, state) => const PerformanceManagementScreen(),
              ),
              GoRoute(
                path: 'tasks',
                name: 'staff-tasks',
                builder: (context, state) => const TaskManagementScreen(),
              ),
              GoRoute(
                path: 'training',
                name: 'staff-training',
                builder: (context, state) => const TrainingManagementScreen(),
              ),
              GoRoute(
                path: 'communication',
                name: 'staff-communication',
                builder: (context, state) => const StaffCommunicationScreen(),
              ),
              GoRoute(
                path: 'ai-assistant',
                name: 'staff-ai-assistant',
                builder: (context, state) => const AiWorkforceAssistantScreen(),
              ),
              GoRoute(
                path: 'analytics',
                name: 'staff-analytics',
                builder: (context, state) => const staff_analytics.StaffAnalyticsScreen(),
              ),
              // Legacy routes
              GoRoute(
                path: 'legacy',
                name: 'staff-legacy',
                builder: (context, state) => const StaffManagementScreen(),
              ),
              GoRoute(
                path: 'legacy-attendance',
                name: 'staff-legacy-attendance',
                builder: (context, state) => const AttendanceScreen(),
              ),
              GoRoute(
                path: 'legacy-shifts',
                name: 'staff-legacy-shifts',
                builder: (context, state) => const ShiftScheduleScreen(),
              ),
            ],
          ),
          // Inventory
          GoRoute(
            path: '/shell/inventory',
            name: 'inventory',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const InventoryDashboardScreen(),
            ),
            routes: [
              GoRoute(
                path: 'items',
                name: 'inventory-items',
                builder: (context, state) => const ProductManagementScreen(),
              ),
              GoRoute(
                path: 'legacy',
                name: 'inventory-legacy',
                builder: (context, state) => const InventoryManagementScreen(),
              ),
              GoRoute(
                path: 'purchase-orders',
                name: 'inventory-purchase-orders',
                builder: (context, state) => const PurchaseOrderScreen(),
              ),
              GoRoute(
                path: 'suppliers',
                name: 'inventory-suppliers',
                builder: (context, state) => const SupplierManagementScreen(),
              ),
              GoRoute(
                path: 'waste',
                name: 'inventory-waste',
                builder: (context, state) => const WasteManagementScreen(),
              ),
              GoRoute(
                path: 'recipes',
                name: 'inventory-recipes',
                builder: (context, state) => const RecipeManagementScreen(),
              ),
              GoRoute(
                path: 'stock-count',
                name: 'inventory-stock-count',
                builder: (context, state) => const StockCountingScreen(),
              ),
              GoRoute(
                path: 'transfers',
                name: 'inventory-transfers',
                builder: (context, state) => const TransferManagementScreen(),
              ),
              GoRoute(
                path: 'batch-expiry',
                name: 'inventory-batch-expiry',
                builder: (context, state) => const BatchExpiryScreen(),
              ),
              GoRoute(
                path: 'warehouses',
                name: 'inventory-warehouses',
                builder: (context, state) => const WarehouseManagementScreen(),
              ),
              GoRoute(
                path: 'ai-assistant',
                name: 'inventory-ai-assistant',
                builder: (context, state) => const AiInventoryAssistantScreen(),
              ),
              GoRoute(
                path: 'analytics',
                name: 'inventory-analytics',
                builder: (context, state) => const InventoryAnalyticsScreen(),
              ),
            ],
          ),
          // Reservations
          GoRoute(
            path: '/shell/reservations',
            name: 'reservations',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const ReservationScreen(),
            ),
          ),
          // CRM
          GoRoute(
            path: '/shell/crm',
            name: 'crm',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const CustomersScreen(),
            ),
            routes: [
              GoRoute(
                path: 'customers',
                name: 'crm-customers',
                pageBuilder: (context, state) => NoTransitionPage(
                  key: state.pageKey,
                  child: const CustomersScreen(),
                ),
              ),
              GoRoute(
                path: 'loyalty',
                name: 'crm-loyalty',
                pageBuilder: (context, state) => NoTransitionPage(
                  key: state.pageKey,
                  child: const LoyaltyScreen(),
                ),
              ),
              GoRoute(
                path: 'reviews',
                name: 'crm-reviews',
                pageBuilder: (context, state) => NoTransitionPage(
                  key: state.pageKey,
                  child: const ReviewsScreen(),
                ),
              ),
            ],
          ),
          // Reports
          GoRoute(
            path: '/shell/reports',
            name: 'reports',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const ReportsScreen(),
            ),
          ),
          // Analytics
          GoRoute(
            path: '/shell/analytics',
            name: 'analytics',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const SalesAnalyticsScreen(),
            ),
            routes: [
              GoRoute(
                path: 'sales',
                name: 'analytics-sales',
                pageBuilder: (context, state) => NoTransitionPage(
                  key: state.pageKey,
                  child: const SalesAnalyticsScreen(),
                ),
              ),
              GoRoute(
                path: 'customers',
                name: 'analytics-customers',
                builder: (context, state) => const CustomerAnalyticsScreen(),
              ),
              GoRoute(
                path: 'inventory',
                name: 'analytics-inventory',
                builder: (context, state) => const InventoryAnalyticsScreen(),
              ),
              GoRoute(
                path: 'staff',
                name: 'analytics-staff',
                builder: (context, state) => const StaffAnalyticsScreen(),
              ),
              GoRoute(
                path: 'kitchen',
                name: 'analytics-kitchen',
                builder: (context, state) => const KitchenAnalyticsScreen(),
              ),
              GoRoute(
                path: 'delivery',
                name: 'analytics-delivery',
                builder: (context, state) => const DeliveryAnalyticsScreen(),
              ),
            ],
          ),
          // Delivery Management
          GoRoute(
            path: '/shell/delivery',
            name: 'delivery',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const DeliveryDashboardScreen(),
            ),
            routes: [
              GoRoute(
                path: 'partners',
                name: 'delivery-partners',
                builder: (context, state) => const DeliveryPartnersScreen(),
              ),
              GoRoute(
                path: 'assign',
                name: 'delivery-assign',
                builder: (context, state) => const DeliveryAssignmentScreen(),
              ),
              GoRoute(
                path: 'tracking',
                name: 'delivery-tracking',
                builder: (context, state) => const DeliveryTrackingScreen(),
              ),
              GoRoute(
                path: 'history',
                name: 'delivery-history',
                builder: (context, state) => const DeliveryHistoryScreen(),
              ),
            ],
          ),
          // Offers & Coupons
          GoRoute(
            path: '/shell/offers',
            name: 'offers',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const CouponManagementScreen(),
            ),
            routes: [
              GoRoute(
                path: 'combos',
                name: 'offers-combos',
                builder: (context, state) => const ComboScreen(),
              ),
            ],
          ),
          // Finance
          GoRoute(
            path: '/shell/finance',
            name: 'finance',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const FinanceDashboardScreen(),
            ),
            routes: [
              GoRoute(
                path: 'income',
                name: 'finance-income',
                builder: (context, state) => const IncomeScreen(),
              ),
              GoRoute(
                path: 'expenses',
                name: 'finance-expenses',
                builder: (context, state) => const ExpenseScreen(),
              ),
              GoRoute(
                path: 'transactions',
                name: 'finance-transactions',
                builder: (context, state) => const TransactionsScreen(),
              ),
              GoRoute(
                path: 'tax',
                name: 'finance-tax',
                builder: (context, state) => const TaxScreen(),
              ),
              GoRoute(
                path: 'invoices',
                name: 'finance-invoices',
                builder: (context, state) => const InvoiceScreen(),
              ),
              GoRoute(
                path: 'reports',
                name: 'finance-reports',
                builder: (context, state) => const FinanceReportsScreen(),
              ),
              GoRoute(
                path: 'accounting',
                name: 'finance-accounting',
                builder: (context, state) => const AccountingScreen(),
              ),
              GoRoute(
                path: 'banking',
                name: 'finance-banking',
                builder: (context, state) => const BankingScreen(),
              ),
              GoRoute(
                path: 'settlements',
                name: 'finance-settlements',
                builder: (context, state) => const SettlementScreen(),
              ),
              GoRoute(
                path: 'purchase-bills',
                name: 'finance-purchase-bills',
                builder: (context, state) => const PurchaseBillsScreen(),
              ),
              GoRoute(
                path: 'budgeting',
                name: 'finance-budgeting',
                builder: (context, state) => const BudgetingScreen(),
              ),
              GoRoute(
                path: 'forecasting',
                name: 'finance-forecasting',
                builder: (context, state) => const ForecastingScreen(),
              ),
              GoRoute(
                path: 'ai-assistant',
                name: 'finance-ai-assistant',
                builder: (context, state) => const AiFinanceAssistantScreen(),
              ),
              GoRoute(
                path: 'analytics',
                name: 'finance-analytics',
                builder: (context, state) => const FinancialAnalyticsScreen(),
              ),
            ],
          ),
          // Support
          GoRoute(
            path: '/shell/support',
            name: 'support',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const SupportDashboardScreen(),
            ),
            routes: [
              GoRoute(
                path: 'tickets',
                name: 'support-tickets',
                builder: (context, state) => const SupportDashboardScreen(),
              ),
              GoRoute(
                path: 'create',
                name: 'support-create',
                builder: (context, state) => const CreateTicketScreen(),
              ),
              GoRoute(
                path: 'ticket/:ticketId',
                name: 'support-ticket-detail',
                builder: (context, state) => TicketDetailScreen(ticketId: state.pathParameters['ticketId']!),
              ),
              GoRoute(
                path: 'faq',
                name: 'support-faq',
                builder: (context, state) => const FaqScreen(),
              ),
              GoRoute(
                path: 'help',
                name: 'support-help',
                builder: (context, state) => const HelpCenterScreen(),
              ),
            ],
          ),
          // More (mobile overflow menu)
          GoRoute(
            path: '/shell/more',
            name: 'more',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const MoreGridScreen(),
            ),
          ),
          // AI Platform
          GoRoute(
            path: '/shell/ai-dashboard',
            name: 'ai-dashboard',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/ai-chat',
            name: 'ai-chat',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiChatScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/ai-insights',
            name: 'ai-insights',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiInsightsScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/ai-reports',
            name: 'ai-reports',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiReportsScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/ai-forecast',
            name: 'ai-forecast',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiForecastScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/ai-workflows',
            name: 'ai-workflows',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiWorkflowsScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/ai-alerts',
            name: 'ai-alerts',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiAlertsScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/ai-search',
            name: 'ai-search',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiSearchScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/ai-settings',
            name: 'ai-settings',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const AiSettingsScreen(),
            ),
          ),
          // Notifications
          GoRoute(
            path: '/shell/notifications',
            name: 'notifications',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const NotificationCenterScreen(),
            ),
          ),
          // Settings
          GoRoute(
            path: '/shell/settings',
            name: 'settings',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const SettingsScreen(),
            ),
          ),
          // Marketing
          GoRoute(
            path: '/shell/marketing',
            name: 'marketing',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const CampaignListScreen(),
            ),
            routes: [
              GoRoute(
                path: 'new',
                name: 'marketing-new',
                builder: (context, state) {
                  final campaign = state.extra as Map<String, dynamic>?;
                  return CreateCampaignScreen(campaign: campaign);
                },
              ),
              GoRoute(
                path: ':campaignId',
                name: 'marketing-details',
                builder: (context, state) => CampaignDetailsScreen(
                  campaignId: state.pathParameters['campaignId']!,
                ),
              ),
            ],
          ),
          // CMS
          GoRoute(
            path: '/shell/cms',
            name: 'cms',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const WebsiteEditorScreen(),
            ),
            routes: [
              GoRoute(
                path: 'home-sections',
                name: 'cms-home-sections',
                builder: (context, state) => const HomeSectionsScreen(),
              ),
              GoRoute(
                path: 'theme',
                name: 'cms-theme',
                builder: (context, state) => const ThemeSettingsScreen(),
              ),
              GoRoute(
                path: 'seo',
                name: 'cms-seo',
                builder: (context, state) => const SeoScreen(),
              ),
            ],
          ),
          // Orders (sub-routes)
          GoRoute(
            path: '/shell/orders/dashboard',
            name: 'order-dashboard',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const OrderDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/shell/orders/:orderId',
            name: 'order-detail',
            builder: (context, state) => OrderDetailScreen(
              orderId: state.pathParameters['orderId']!,
            ),
          ),
          // POS sub-routes
          GoRoute(
            path: '/shell/pos/reports',
            name: 'pos-reports',
            builder: (context, state) => const PosReportScreen(),
          ),
          GoRoute(
            path: '/shell/pos/receipt/:orderId',
            name: 'pos-receipt',
            builder: (context, state) {
              final extra = state.extra as Map<String, dynamic>?;
              return ReceiptPreviewScreen(
                orderId: state.pathParameters['orderId'],
                orderNumber: extra?['orderNumber'] as int?,
                items: (extra?['items'] as List<dynamic>?)?.cast<CartItem>(),
                billing: extra?['billing'] as PaymentBreakdown?,
                tableName: extra?['tableName'] as String?,
              );
            },
          ),
          // Menu sub-routes
          GoRoute(
            path: '/shell/menu/new-item',
            name: 'menu-item-new',
            builder: (context, state) {
              final container = ProviderScope.containerOf(context, listen: false);
              return MenuItemFormScreen(
                menuProvider: container.read(menuProvider),
              );
            },
          ),
          GoRoute(
            path: '/shell/menu/:itemId/edit-item',
            name: 'menu-item-edit',
            builder: (context, state) {
              final container = ProviderScope.containerOf(context, listen: false);
              final menuProv = container.read(menuProvider);
              final itemId = state.pathParameters['itemId']!;
              final items = menuProv.items;
              final item = items.firstWhere(
                (i) => i.id == itemId,
                orElse: () => items.first,
              );
              return MenuItemFormScreen(
                menuProvider: menuProv,
                item: item,
              );
            },
          ),
          // Inventory waste tracking (legacy)
          GoRoute(
            path: '/shell/inventory/waste-tracking',
            name: 'inventory-waste-tracking',
            builder: (context, state) => const WasteTrackingScreen(),
          ),
          // Profile
          GoRoute(
            path: '/shell/profile',
            name: 'profile',
            pageBuilder: (context, state) => NoTransitionPage(
              key: state.pageKey,
              child: const ProfileScreen(),
            ),
          ),
        ],
      ),

      // ── Standalone payment route ──
      GoRoute(
        path: '/payment',
        name: 'payment',
        builder: (context, state) => PaymentScreen(
          orderId: state.uri.queryParameters['orderId'] ?? '',
        ),
      ),
    ],

    // ── Error handler ──
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(title: const Text('Page Not Found')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(
              'Route not found: ${state.matchedLocation}',
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/shell/dashboard'),
              child: const Text('Go to Dashboard'),
            ),
          ],
        ),
      ),
    ),
  );

  // Listen to auth provider changes to re-evaluate redirect
  authNotifier.addListener(router.refresh);
  return router;
}
