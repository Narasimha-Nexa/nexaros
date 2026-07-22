import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/kitchen_models.dart';
import '../providers/kitchen_provider.dart';

class ChefManagementScreen extends ConsumerStatefulWidget {
  const ChefManagementScreen({super.key});

  @override
  ConsumerState<ChefManagementScreen> createState() => _ChefManagementScreenState();
}

class _ChefManagementScreenState extends ConsumerState<ChefManagementScreen> {
  late final dynamic _api;
  List<ChefModel> _chefs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadChefs();
  }

  Future<void> _loadChefs() async {
    setState(() => _isLoading = true);
    try {
      final branchId = ref.read(appStateProvider).branchId ?? '';
      final result = await _api.getStaff(branchId: branchId);
      final staffList = result is Map ? List<dynamic>.from(result['staff'] ?? []) : <dynamic>[];
      _chefs = staffList
          .map((json) => ChefModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final kitchen = ref.watch(kitchenProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text('Chef Management', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: cs.surface,
        elevation: 0,
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : _chefs.isEmpty
              ? const NxEmptyState(icon: Icons.person_outline, title: 'No chefs found')
              : RefreshIndicator(
                  onRefresh: _loadChefs,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _chefs.length,
                    itemBuilder: (ctx, i) => _buildChefCard(_chefs[i], kitchen),
                  ),
                ),
    );
  }

  Widget _buildChefCard(ChefModel chef, KitchenProvider kitchen) {
    final assignedOrders = kitchen.state.orders.where((o) => o.assignedChefId == chef.id).toList();
    final completedToday = assignedOrders.where((o) => o.status == KitchenOrderStatus.completed).length;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          // Avatar
          Stack(children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: chef.isAvailable ? AppColors.primary50 : AppColors.gray100,
              child: Text(
                chef.name.isNotEmpty ? chef.name[0].toUpperCase() : '?',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold, fontSize: 18,
                  color: chef.isAvailable ? AppColors.primary : AppColors.gray400),
              ),
            ),
            Positioned(
              right: 0, bottom: 0,
              child: Container(
                width: 14, height: 14,
                decoration: BoxDecoration(
                  color: chef.isAvailable ? AppColors.success : AppColors.gray300,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
          ]),
          const SizedBox(width: 14),
          // Info
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(chef.name, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(width: 8),
                if (chef.primaryStation != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary50,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(chef.primaryStation!.label, style: GoogleFonts.inter(
                      fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primary)),
                  ),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                _ChefStat(Icons.work, '${assignedOrders.length} active', AppColors.warning),
                const SizedBox(width: 12),
                _ChefStat(Icons.check_circle, '$completedToday done', AppColors.success),
                const SizedBox(width: 12),
                _ChefStat(Icons.timer, '${chef.avgCompletionTime.inMinutes}m avg', AppColors.primary),
              ]),
              const SizedBox(height: 4),
              // Workload bar
              ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: LinearProgressIndicator(
                  value: (chef.currentOrders / 10).clamp(0.0, 1.0),
                  backgroundColor: AppColors.gray100,
                  color: chef.currentOrders > 8 ? AppColors.danger : AppColors.primary,
                  minHeight: 4,
                ),
              ),
            ]),
          ),
          // Assign button
          IconButton(
            icon: const Icon(Icons.person_add, size: 20),
            color: AppColors.primary,
            tooltip: 'Assign to order',
            onPressed: () => _showAssignDialog(chef, kitchen),
          ),
        ]),
      ),
    );
  }

  void _showAssignDialog(ChefModel chef, KitchenProvider kitchen) {
    final pendingOrders = kitchen.state.orders.where((o) =>
      o.assignedChefId == null && o.status.isActive
    ).toList();

    if (pendingOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No unassigned active orders'), backgroundColor: AppColors.warning),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5, minChildSize: 0.3, maxChildSize: 0.7, expand: false,
        builder: (ctx, scrollController) => Column(children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Assign ${chef.name} to order', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
          ),
          Expanded(
            child: ListView.builder(
              controller: scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: pendingOrders.length,
              itemBuilder: (ctx, i) {
                final order = pendingOrders[i];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primary50,
                    child: Text(order.displayOrderNumber, style: GoogleFonts.inter(
                      fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary)),
                  ),
                  title: Text('${order.displayTable.isNotEmpty ? "${order.displayTable} • " : ""}Order ${order.displayOrderNumber}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  subtitle: Text('${order.items.length} items • ${order.ageDisplay}', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.pop(ctx);
                    kitchen.assignChef(order.id, chef.id, chef.name);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Assigned ${chef.name} to ${order.displayOrderNumber}'), backgroundColor: AppColors.success),
                    );
                  },
                );
              },
            ),
          ),
        ]),
      ),
    );
  }
}

class _ChefStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _ChefStat(this.icon, this.label, this.color);

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Icon(icon, size: 12, color: color),
      const SizedBox(width: 3),
      Text(label, style: GoogleFonts.inter(fontSize: 11, color: color)),
    ]);
  }
}
