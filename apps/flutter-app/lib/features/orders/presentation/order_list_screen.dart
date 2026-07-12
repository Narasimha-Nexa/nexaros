import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../pos/presentation/pos_screen.dart';

class OrderListScreen extends StatefulWidget {
  const OrderListScreen({super.key});

  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> {
  final _api = ApiClient();
  List<dynamic> _orders = [];
  bool _isLoading = true;
  String _statusFilter = '';

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final orders = await _api.getOrders(status: _statusFilter.isEmpty ? null : _statusFilter);
      if (mounted) setState(() { _orders = orders; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'PENDING': return AppColors.orderPending;
      case 'CONFIRMED': return AppColors.orderConfirmed;
      case 'PREPARING': return AppColors.orderPreparing;
      case 'READY': return AppColors.orderReady;
      case 'SERVED': return AppColors.orderServed;
      case 'COMPLETED': return AppColors.orderCompleted;
      case 'CANCELLED': return AppColors.orderCancelled;
      default: return AppColors.gray400;
    }
  }

  String _statusLabel(String status) {
    return status[0] + status.substring(1).toLowerCase().replaceAll('_', ' ');
  }

  @override
  Widget build(BuildContext context) {
    final filters = ['', 'PENDING', 'PREPARING', 'READY', 'COMPLETED'];
    final filterLabels = {'': 'All', 'PENDING': 'Pending', 'PREPARING': 'Preparing', 'READY': 'Ready', 'COMPLETED': 'Completed'};
    return Scaffold(
      appBar: AppBar(title: Text('Orders', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: Column(
        children: [
          // Status filter chips
          Container(
            color: AppColors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (ctx, i) {
                  final isSelected = _statusFilter == filters[i];
                  return FilterChip(
                    label: Text(filterLabels[filters[i]]!, style: GoogleFonts.inter(fontSize: 12)),
                    selected: isSelected,
                    onSelected: (_) { _statusFilter = filters[i]; _loadOrders(); },
                    selectedColor: AppColors.primary100,
                    checkmarkColor: AppColors.primary,
                  );
                },
              ),
            ),
          ),
          // Orders list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _orders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.receipt_long, size: 48, color: AppColors.gray300),
                            const SizedBox(height: 8),
                            Text('No orders found', style: GoogleFonts.inter(color: AppColors.gray400)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadOrders,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _orders.length,
                          itemBuilder: (ctx, i) => _buildOrderCard(_orders[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final total = double.tryParse(order['totalAmount'].toString()) ?? 0;
    final status = order['status'] ?? 'PENDING';
    final type = order['type'] ?? 'DINE_IN';
    final items = order['items'] as List<dynamic>? ?? [];
    final table = order['table'] as Map<String, dynamic>?;
    final createdAt = DateTime.tryParse(order['createdAt'] ?? '') ?? DateTime.now();
    final timeStr = '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => POSScreen(orderId: order['id']))),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text('#${order['orderNumber']}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _statusColor(status).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(_statusLabel(status), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: _statusColor(status))),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.access_time, size: 14, color: AppColors.gray400),
                  const SizedBox(width: 4),
                  Text(timeStr, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.gray100, borderRadius: BorderRadius.circular(4)),
                    child: Text(type.replaceAll('_', ' '), style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray600)),
                  ),
                  if (table != null) ...[
                    const SizedBox(width: 8),
                    Icon(Icons.table_restaurant, size: 14, color: AppColors.gray400),
                    const SizedBox(width: 4),
                    Text('T${table['number']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                  ],
                ],
              ),
              if (items.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  items.map((i) => '${i['quantity']}x ${i['name'] ?? i['menuItem']?['name'] ?? ''}').join(', '),
                  style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              const Divider(height: 16),
              Row(
                children: [
                  Text('₹${total.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15)),
                  const Spacer(),
                  if (status == 'PENDING' || status == 'CONFIRMED')
                    _buildActionButton('Prepare', AppColors.orderPreparing, () => _updateStatus(order['id'], 'PREPARING')),
                  if (status == 'PREPARING')
                    _buildActionButton('Ready', AppColors.orderReady, () => _updateStatus(order['id'], 'READY')),
                  if (status == 'READY')
                    _buildActionButton('Served', AppColors.orderServed, () => _updateStatus(order['id'], 'SERVED')),
                  if (status == 'SERVED')
                    _buildActionButton('Pay', AppColors.primary, () => _updateStatus(order['id'], 'COMPLETED')),
                  if (status != 'COMPLETED' && status != 'CANCELLED')
                    Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: TextButton(
                        onPressed: () => _updateStatus(order['id'], 'CANCELLED'),
                        child: const Text('Cancel', style: TextStyle(color: AppColors.danger, fontSize: 12)),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton(String label, Color color, VoidCallback onPressed) {
    return SizedBox(
      height: 30,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: AppColors.white,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          textStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
        ),
        child: Text(label),
      ),
    );
  }

  Future<void> _updateStatus(String orderId, String status) async {
    try {
      await _api.updateOrderStatus(orderId, status);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order updated to ${_statusLabel(status)}'), backgroundColor: AppColors.success),
        );
        _loadOrders();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
        );
      }
    }
  }
}
