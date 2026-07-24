import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import '../providers/app_state.dart';
import '../providers/theme_provider.dart';
import '../providers/role_provider.dart';
import '../providers/subscription_provider.dart';
import '../providers/branch_provider.dart';
import '../providers/accessibility_provider.dart';
import '../providers/keyboard_shortcuts_provider.dart';
import '../shell/shell_provider.dart';
import '../logging/app_logger.dart';
import '../analytics/analytics_service.dart';
import '../security/secure_storage.dart';
import '../file/file_service.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/menu/providers/menu_provider.dart';
import '../../features/orders/data/order_service.dart';

import '../../features/ai_platform/data/ai_service.dart';
import '../../features/ai_platform/providers/ai_providers.dart';
import '../../features/orders/providers/orders_provider.dart';
import '../../features/tables/providers/tables_provider.dart';
import '../../features/payments/providers/payments_provider.dart';
import '../../features/reservations/providers/reservations_provider.dart';
import '../../features/crm/providers/crm_provider.dart';
import '../../features/finance/providers/finance_provider.dart';
import '../../features/offers/providers/offers_provider.dart';
import '../../features/delivery/providers/delivery_provider.dart';
import '../../features/analytics/providers/analytics_provider.dart';
import '../../features/inventory/providers/inventory_provider.dart';
import '../../features/support/providers/support_provider.dart';
import '../../features/kitchen/providers/kitchen_provider.dart';
import '../../features/staff/providers/staff_provider.dart';
import '../../features/staff/data/staff_service.dart';
import '../../features/pos/providers/pos_provider.dart';
import '../../features/pos/data/pos_service.dart';
import '../../features/reports/providers/reports_provider.dart';
import '../../features/notifications/providers/notifications_provider.dart';
import '../../features/marketing/providers/marketing_provider.dart';
import '../../features/cms/providers/cms_provider.dart';

/// ── Tier 0: No dependencies ──

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final appStateProvider = ChangeNotifierProvider<AppState>((ref) {
  final state = AppState();
  ref.onDispose(() => state.dispose());
  return state;
});

final themeProvider = ChangeNotifierProvider<ThemeProvider>((ref) {
  final provider = ThemeProvider();
  ref.onDispose(() => provider.dispose());
  return provider;
});

final shellProvider = ChangeNotifierProvider<ShellProvider>((ref) {
  final provider = ShellProvider();
  ref.onDispose(() => provider.dispose());
  return provider;
});

/// ── Tier 1: Depends on ApiClient only ──

final authProvider = ChangeNotifierProvider<AuthProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = AuthProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final roleProvider = ChangeNotifierProvider<RoleProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = RoleProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final subscriptionProvider = ChangeNotifierProvider<SubscriptionProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = SubscriptionProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final branchProvider = ChangeNotifierProvider<BranchProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = BranchProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final offersProvider = ChangeNotifierProvider<OffersProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = OffersProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final analyticsProvider = ChangeNotifierProvider<AnalyticsProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = AnalyticsProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final reportsProvider = ChangeNotifierProvider<ReportsProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = ReportsProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final marketingProvider = ChangeNotifierProvider<MarketingProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = MarketingProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final cmsProvider = ChangeNotifierProvider<CmsProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = CmsProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

/// ── Tier 2: Depends on ApiClient + EventBus ──

final menuProvider = ChangeNotifierProvider<MenuProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = MenuProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final orderServiceProvider = Provider<OrderService>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  return OrderService(api, appState.eventBus);
});

final ordersProvider = ChangeNotifierProvider<OrdersProvider>((ref) {
  final orderService = ref.watch(orderServiceProvider);
  final appState = ref.watch(appStateProvider);
  final provider = OrdersProvider(orderService, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final tablesProvider = ChangeNotifierProvider<TablesProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = TablesProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final paymentsProvider = ChangeNotifierProvider<PaymentsProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = PaymentsProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final reservationsProvider = ChangeNotifierProvider<ReservationsProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = ReservationsProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final crmProvider = ChangeNotifierProvider<CrmProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = CrmProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final financeProvider = ChangeNotifierProvider<FinanceProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = FinanceProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final deliveryProvider = ChangeNotifierProvider<DeliveryProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = DeliveryProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final inventoryProvider = ChangeNotifierProvider<InventoryProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = InventoryProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final kitchenProvider = ChangeNotifierProvider<KitchenProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = KitchenProvider(api, appState.eventBus, appState.socket);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final staffProvider = ChangeNotifierProvider<StaffProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final service = StaffService(api);
  final provider = StaffProvider(service, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final posProvider = ChangeNotifierProvider<PosProvider>((ref) {
  final appState = ref.watch(appStateProvider);
  final posService = PosService(appState.api, appState.offlineOrders, appState.offlinePayments, appState.printer);
  final provider = PosProvider(appState.eventBus, posService);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final notificationsProvider = ChangeNotifierProvider<NotificationsProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final appState = ref.watch(appStateProvider);
  final provider = NotificationsProvider(api, appState.eventBus);
  ref.onDispose(() => provider.dispose());
  return provider;
});

final supportProvider = ChangeNotifierProvider<SupportProvider>((ref) {
  final api = ref.watch(apiClientProvider);
  final provider = SupportProvider(api);
  ref.onDispose(() => provider.dispose());
  return provider;
});

/// ── Tier 3: Core Infrastructure Engines ──

final loggerProvider = Provider<AppLogger>((ref) => AppLogger());

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  final service = AnalyticsService();
  service.init();
  ref.onDispose(() => service.dispose());
  return service;
});

final secureStorageProvider = Provider<SecureStorage>((ref) => SecureStorage());

final fileServiceProvider = Provider<FileService>((ref) => FileService());

final aiPlatformServiceProvider = Provider<AiPlatformService>((ref) {
  return AiPlatformService(ref.watch(apiClientProvider));
});

final aiChatProvider = ChangeNotifierProvider<AiChatProvider>((ref) {
  return AiChatProvider(ref.watch(aiPlatformServiceProvider));
});

final aiConversationListProvider = ChangeNotifierProvider<AiConversationListProvider>((ref) {
  return AiConversationListProvider(ref.watch(aiPlatformServiceProvider));
});

final aiDashboardProvider = ChangeNotifierProvider<AiDashboardProvider>((ref) {
  return AiDashboardProvider(ref.watch(aiPlatformServiceProvider));
});

final aiReportsProvider = ChangeNotifierProvider<AiReportsProvider>((ref) {
  return AiReportsProvider(ref.watch(aiPlatformServiceProvider));
});

final aiWorkflowProvider = ChangeNotifierProvider<AiWorkflowProvider>((ref) {
  return AiWorkflowProvider();
});

final accessibilityProvider = ChangeNotifierProvider<AccessibilityProvider>((ref) {
  return AccessibilityProvider();
});

final keyboardShortcutsProvider = ChangeNotifierProvider<KeyboardShortcutsRegistry>((ref) {
  return KeyboardShortcutsRegistry();
});
