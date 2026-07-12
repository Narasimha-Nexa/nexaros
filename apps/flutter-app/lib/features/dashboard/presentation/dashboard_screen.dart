import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../menu/presentation/menu_management_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = ApiClient();
  Map<String, dynamic>? _stats;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final stats = await _api.getTodayStats();
      if (mounted) setState(() { _stats = stats; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
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
                            _StatCard(title: 'Total Orders', value: '${_stats?['totalOrders'] ?? 0}', icon: Icons.receipt_long, color: Colors.blue),
                            _StatCard(title: 'Revenue', value: '₹${(_stats?['totalRevenue'] ?? 0).toStringAsFixed(0)}', icon: Icons.currency_rupee, color: Colors.green),
                            _StatCard(title: 'Avg Order', value: '₹${(_stats?['avgOrderValue'] ?? 0).toStringAsFixed(0)}', icon: Icons.analytics, color: Colors.orange),
                            _StatCard(title: 'Pending', value: '${_stats?['pendingOrders'] ?? 0}', icon: Icons.pending_actions, color: Colors.red),
                          ],
                        ),
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
                            _ActionCard(title: 'Menu', icon: Icons.restaurant_menu, onTap: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => const MenuManagementScreen()));
                            }),
                            _ActionCard(title: 'Orders', icon: Icons.receipt, onTap: () {}),
                            _ActionCard(title: 'Tables', icon: Icons.table_restaurant, onTap: () {}),
                            _ActionCard(title: 'Kitchen', icon: Icons.kitchen, onTap: () {}),
                            _ActionCard(title: 'Inventory', icon: Icons.inventory_2, onTap: () {}),
                            _ActionCard(title: 'Reports', icon: Icons.bar_chart, onTap: () {}),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({required this.title, required this.value, required this.icon, required this.color});

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

class _ActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;

  const _ActionCard({required this.title, required this.icon, required this.onTap});

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
