import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../features/delivery/providers/delivery_provider.dart';

class DeliveryAssignmentScreen extends ConsumerStatefulWidget {
  const DeliveryAssignmentScreen({super.key});

  @override
  ConsumerState<DeliveryAssignmentScreen> createState() => _DeliveryAssignmentScreenState();
}

class _DeliveryAssignmentScreenState extends ConsumerState<DeliveryAssignmentScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = ref.read(appStateProvider);
      final branchId = appState.branchId ?? '';
      if (branchId.isNotEmpty) {
        ref.read(deliveryProvider.notifier).loadPendingOrders(branchId);
        ref.read(deliveryProvider.notifier).loadPartners();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final delivery = ref.watch(deliveryProvider);
    final pendingOrders = delivery.pendingOrders;
    final partners = delivery.partners;
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      appBar: AppBar(
        title: Text('Order Assignment', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.warning,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              final appState = ref.read(appStateProvider);
              final branchId = appState.branchId ?? '';
              if (branchId.isNotEmpty) {
                delivery.loadPendingOrders(branchId);
                delivery.loadPartners();
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          final appState = ref.read(appStateProvider);
          final branchId = appState.branchId ?? '';
          if (branchId.isNotEmpty) {
            await delivery.loadPendingOrders(branchId);
            await delivery.loadPartners();
          }
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Auto-assign button
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.auto_awesome, color: AppColors.success, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Auto-Assign', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                            Text('${partners.length} partners available, ${pendingOrders.length} orders pending',
                                style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                          ],
                        ),
                      ),
                      ElevatedButton.icon(
                        onPressed: delivery.pendingOrders.isEmpty
                            ? null
                            : () async {
                                final snackMessenger = ScaffoldMessenger.of(context);
                                final appState = ref.read(appStateProvider);
                                final success = await delivery.autoAssign();
                                if (!mounted) return;
                                snackMessenger.showSnackBar(
                                  SnackBar(
                                    content: Text(success ? 'Orders auto-assigned!' : 'Auto-assign failed'),
                                    backgroundColor: success ? AppColors.success : AppColors.danger,
                                  ),
                                );
                                if (success) {
                                  final branchId = appState.branchId ?? '';
                                  if (branchId.isNotEmpty) {
                                    delivery.loadPendingOrders(branchId);
                                  }
                                }
                              },
                        icon: const Icon(Icons.auto_awesome, size: 16),
                        label: const Text('Assign All'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Pending orders section
              Row(
                children: [
                  Text('Pending Orders', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('${pendingOrders.length}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.warning)),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              if (delivery.pendingOrdersLoading && pendingOrders.isEmpty)
                const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
              else if (pendingOrders.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.check_circle, size: 40, color: AppColors.success),
                          const SizedBox(height: 8),
                          Text('All orders assigned', style: GoogleFonts.inter(color: AppColors.gray500)),
                          const SizedBox(height: 4),
                          Text('No pending delivery orders', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
                        ],
                      ),
                    ),
                  ),
                )
              else
                ...pendingOrders.map((order) => _buildPendingOrderCard(context, delivery, order, partners, isMobile)),

              if (pendingOrders.isNotEmpty) ...[
                const SizedBox(height: 20),

                // Available partners section
                Row(
                  children: [
                    Text('Available Partners', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text('${partners.length}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.success)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: partners
                      .where((p) => p['status'] == 'AVAILABLE')
                      .map((p) => Chip(
                            avatar: Icon(Icons.person, size: 16, color: AppColors.success),
                            label: Text(p['name'] ?? '-', style: GoogleFonts.inter(fontSize: 12)),
                            backgroundColor: AppColors.success.withValues(alpha: 0.08),
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPendingOrderCard(BuildContext context, DeliveryProvider delivery, Map<String, dynamic> order, List<Map<String, dynamic>> partners, bool isMobile) {
    final orderNumber = order['orderNumber'] ?? '-';
    final customerName = order['customerName'] ?? 'Guest';
    final totalAmount = order['totalAmount'] ?? 0;
    final address = order['deliveryAddress'] ?? order['address'] ?? '-';
    final createdAt = DateTime.tryParse(order['createdAt'] ?? '');
    final timeStr = createdAt != null ? DateFormat('HH:mm').format(createdAt) : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.receipt_long, color: AppColors.warning, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Order #$orderNumber', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                      Text('$customerName · $timeStr', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    ],
                  ),
                ),
                Text('₹${double.tryParse(totalAmount.toString())?.toStringAsFixed(2) ?? totalAmount}',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.success)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.location_on, size: 14, color: AppColors.gray400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(address, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500), maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Partner selector
            DropdownButtonFormField<String>(
              decoration: InputDecoration(
                labelText: 'Assign partner',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                isDense: true,
              ),
              items: [
                const DropdownMenuItem(value: '', child: Text('Select partner')),
                ...partners
                    .where((p) => p['status'] == 'AVAILABLE')
                    .map((p) => DropdownMenuItem(
                          value: p['id'] ?? '',
                          child: Text(p['name'] ?? '-'),
                        )),
              ],
              onChanged: (selectedId) async {
                if (selectedId != null && selectedId.isNotEmpty) {
                  final snackMessenger = ScaffoldMessenger.of(context);
                  final appState = ref.read(appStateProvider);
                  final deliveryId = await delivery.createDeliveryFromOrder(order['id'] ?? '');
                  if (deliveryId != null) {
                    await delivery.assignDelivery(deliveryId, selectedId);
                    if (!mounted) return;
                    snackMessenger.showSnackBar(
                      SnackBar(content: Text('Order assigned'), backgroundColor: AppColors.success),
                    );
                    final branchId = appState.branchId ?? '';
                    if (branchId.isNotEmpty) {
                      delivery.loadPendingOrders(branchId);
                    }
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
