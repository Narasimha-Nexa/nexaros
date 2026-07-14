import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/network/api_client.dart';
import '../../../core/providers/subscription_provider.dart';
import '../../../core/utils/date_utils.dart' as app_date_utils;
import '../../menu/presentation/menu_management_screen.dart';
import '../../orders/presentation/order_list_screen.dart';
import '../../tables/presentation/table_grid_screen.dart';
import '../../pos/presentation/pos_screen.dart';
import '../../reports/presentation/report_charts.dart';
import '../../subscriptions/presentation/subscription_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiClient();
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _dailySales;
  Map<String, dynamic>? _itemPerformance;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final today = app_date_utils.DateUtils.toApiDate(DateTime.now());
      final results = await Future.wait([
        _api.getTodayStats(),
        _api.getReport('daily-sales', today, today),
        _api.getReport('items', today, today),
      ]);
      if (mounted) {
        setState(() {
          _stats = results[0];
          _dailySales = results[1];
          _itemPerformance = results[2];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Widget _buildSubscriptionBanner(BuildContext context) {
    final provider = context.watch<SubscriptionProvider>();
    final info = provider.info;

    if (info.isNone || info.isActive) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionScreen())),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: provider.statusColor.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: provider.statusColor.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Icon(provider.statusIcon, color: provider.statusColor, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    provider.statusLabel,
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: provider.statusColor),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    info.isTrial
                        ? provider.trialMessage
                        : info.isGracePeriod
                            ? provider.gracePeriodMessage
                            : provider.restrictedMessage,
                    style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: provider.statusColor, size: 18),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () => setState(() { _isLoading = true; _loadStats(); })),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(_error!, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _loadStats, child: const Text('Retry')),
                ]))
              : RefreshIndicator(
                  onRefresh: _loadStats,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Subscription trial/upgrade prompt
                          _buildSubscriptionBanner(context),

                          Text('Today\'s Overview', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        GridView.count(
                          crossAxisCount: isMobile ? 2 : 4,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 1.4,
                          children: [
                            StatCard(title: 'Total Orders', value: '${_stats?['totalOrders'] ?? 0}', icon: Icons.receipt_long, color: Colors.blue),
                            StatCard(title: 'Revenue', value: '₹${(_stats?['totalRevenue'] ?? 0).toStringAsFixed(0)}', icon: Icons.currency_rupee, color: Colors.green),
                            StatCard(title: 'Avg Order', value: '₹${(_stats?['avgOrderValue'] ?? 0).toStringAsFixed(0)}', icon: Icons.analytics, color: Colors.orange),
                            StatCard(title: 'Pending', value: '${_stats?['pendingOrders'] ?? 0}', icon: Icons.pending_actions, color: Colors.red),
                          ],
                        ),
                        // Revenue chart
                        if (_dailySales != null) ...[
                          const SizedBox(height: 24),
                          Text('Revenue Today', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: SizedBox(
                                height: 180,
                                child: RevenueLineChart(
                                  data: ChartData.fromDailySales(
                                    (_dailySales!['daily'] as List<dynamic>?) ?? [],
                                  ),
                                  lineColor: AppColors.success,
                                ),
                              ),
                            ),
                          ),
                        ],

                        // Top selling items
                        if (_itemPerformance != null) ...[
                          const SizedBox(height: 24),
                          Text('Top Selling Items', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: CategoryBarChart(
                                items: ChartData.fromItemPerformance(
                                  (_itemPerformance!['topSelling'] as List<dynamic>?) ?? [],
                                ),
                              ),
                            ),
                          ),
                        ],

                        const SizedBox(height: 24),
                        Text('Quick Actions', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        GridView.count(
                          crossAxisCount: isMobile ? 2 : 3,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 2.2,
                          children: [
                            ActionCard(title: 'Menu', icon: Icons.restaurant_menu, onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const MenuManagementScreen()));
                            }),
                            ActionCard(title: 'Orders', icon: Icons.receipt, onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const OrderListScreen()));
                            }),
                            ActionCard(title: 'Tables', icon: Icons.table_restaurant, onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const TableGridScreen()));
                            }),
                            ActionCard(title: 'POS', icon: Icons.point_of_sale, onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const POSScreen()));
                            }),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}

class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const StatCard({super.key, required this.title, required this.value, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(value, style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold)),
            Text(title, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
          ],
        ),
      ),
    );
  }
}

class ActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;

  const ActionCard({super.key, required this.title, required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 28),
              const SizedBox(width: 12),
              Text(title, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}
