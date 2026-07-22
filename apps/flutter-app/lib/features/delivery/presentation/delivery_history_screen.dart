import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../features/delivery/providers/delivery_provider.dart';

class DeliveryHistoryScreen extends ConsumerStatefulWidget {
  const DeliveryHistoryScreen({super.key});

  @override
  ConsumerState<DeliveryHistoryScreen> createState() => _DeliveryHistoryScreenState();
}

class _DeliveryHistoryScreenState extends ConsumerState<DeliveryHistoryScreen> {
  int _page = 1;
  final int _limit = 20;
  final _searchCtrl = TextEditingController();
  String _statusFilter = '';
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() {
    ref.read(deliveryProvider.notifier).loadHistory(page: _page, limit: _limit);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final delivery = ref.watch(deliveryProvider);
    final history = delivery.history;
    final total = delivery.historyTotal;
    final isLoading = delivery.historyLoading;
    final hasMore = _page * _limit < total;

    return Scaffold(
      appBar: AppBar(
        title: Text('Delivery History', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.info,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_showFilters ? Icons.filter_list_off : Icons.filter_list),
            onPressed: () => setState(() => _showFilters = !_showFilters),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.white,
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search by order number or customer...',
                prefixIcon: const Icon(Icons.search, size: 20),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                isDense: true,
              ),
              onSubmitted: (_) => _loadData(),
            ),
          ),

          // Filters
          if (_showFilters)
            Container(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              color: Colors.white,
              child: Row(
                children: [
                  Text('Status: ', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                  const SizedBox(width: 8),
                  DropdownButton<String>(
                    value: _statusFilter,
                    underline: const SizedBox(),
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500),
                    items: const [
                      DropdownMenuItem(value: '', child: Text('All')),
                      DropdownMenuItem(value: 'DELIVERED', child: Text('Delivered')),
                      DropdownMenuItem(value: 'IN_TRANSIT', child: Text('In Transit')),
                      DropdownMenuItem(value: 'CANCELLED', child: Text('Cancelled')),
                      DropdownMenuItem(value: 'FAILED', child: Text('Failed')),
                    ],
                    onChanged: (v) {
                      setState(() => _statusFilter = v ?? '');
                      _loadData();
                    },
                  ),
                  const Spacer(),
                  Text('$total total', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                ],
              ),
            ),

          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                _page = 1;
                _loadData();
              },
              child: _buildList(context, delivery, history, isLoading, hasMore),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(BuildContext context, DeliveryProvider delivery, List<Map<String, dynamic>> history, bool isLoading, bool hasMore) {
    if (isLoading && history.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (history.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history, size: 64, color: AppColors.gray300),
            const SizedBox(height: 16),
            Text('No delivery history', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.gray500)),
            const SizedBox(height: 8),
            Text('Completed deliveries will appear here', style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray400)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: history.length + (hasMore ? 1 : 0),
      itemBuilder: (ctx, i) {
        // Load more indicator
        if (i >= history.length) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Center(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(foregroundColor: AppColors.info),
                onPressed: () {
                  setState(() => _page++);
                  _loadData();
                },
                child: Text('Load More', style: GoogleFonts.inter(fontSize: 12)),
              ),
            ),
          );
        }

        final d = history[i];
        final partner = d['partner'] as Map<String, dynamic>?;
        final order = d['order'] as Map<String, dynamic>?;
        final status = d['status'] as String? ?? 'CANCELLED';
        final orderNumber = order?['orderNumber'] ?? '-';
        final customerName = order?['customerName'] ?? 'Guest';
        final partnerName = partner?['name'] ?? '-';
        final totalAmount = order?['totalAmount'] ?? 0;
        final createdAt = DateTime.tryParse(d['createdAt'] ?? '');
        final dateStr = createdAt != null ? DateFormat('MMM dd, yyyy · HH:mm').format(createdAt) : '';

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
                        color: _statusColor(status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(_statusIcon(status), color: _statusColor(status), size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text('Order #$orderNumber', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                              const Spacer(),
                              Text('₹${double.tryParse(totalAmount.toString())?.toStringAsFixed(2) ?? totalAmount}',
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.success)),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(Icons.person, size: 12, color: AppColors.gray400),
                              const SizedBox(width: 4),
                              Text(customerName, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                              const SizedBox(width: 12),
                              Icon(Icons.delivery_dining, size: 12, color: AppColors.gray400),
                              const SizedBox(width: 4),
                              Text(partnerName, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 12, color: AppColors.gray400),
                    const SizedBox(width: 4),
                    Text(dateStr, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray400)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(_statusLabel(status), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: _statusColor(status))),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return AppColors.success;
      case 'IN_TRANSIT':
        return AppColors.secondary;
      case 'CANCELLED':
        return AppColors.gray500;
      case 'FAILED':
        return AppColors.danger;
      case 'ASSIGNED':
        return AppColors.info;
      default:
        return AppColors.gray500;
    }
  }

  IconData _statusIcon(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return Icons.check_circle;
      case 'IN_TRANSIT':
        return Icons.local_shipping;
      case 'CANCELLED':
        return Icons.cancel;
      case 'FAILED':
        return Icons.error;
      case 'ASSIGNED':
        return Icons.person_pin;
      default:
        return Icons.circle;
    }
  }

  String _statusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'Delivered';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'CANCELLED':
        return 'Cancelled';
      case 'FAILED':
        return 'Failed';
      case 'ASSIGNED':
        return 'Assigned';
      default:
        return status;
    }
  }
}
