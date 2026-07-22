import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_theme.dart';

class CustomersScreen extends ConsumerStatefulWidget {
  const CustomersScreen({super.key});
  @override
  ConsumerState<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends ConsumerState<CustomersScreen> {
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    ref.read(crmProvider.notifier).loadCustomers();
    _scrollCtrl.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 200) {
      final crm = ref.read(crmProvider.notifier);
      if (!crm.customersLoading && crm.customers.length < crm.customerTotal) {
        crm.loadNextCustomers(search: _searchCtrl.text.isEmpty ? null : _searchCtrl.text);
      }
    }
  }

  @override
  void dispose() { _searchCtrl.dispose(); _scrollCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final crm = ref.watch(crmProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Customers', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary, foregroundColor: Colors.white,
      ),
      body: Column(children: [
        // Search
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Search by name, phone, email...',
              prefixIcon: const Icon(Icons.search, size: 20),
              suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear, size: 20), onPressed: () { _searchCtrl.clear(); crm.loadCustomers(search: ''); })
                  : null,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onChanged: (v) => crm.loadCustomers(search: v),
          ),
        ),
        // Stats
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(children: [
            _statChip(Icons.people, '${crm.customerTotal} total', AppColors.primary),
            const SizedBox(width: 8),
            if (crm.loyaltySummary['totalPoints'] != null)
              _statChip(Icons.card_giftcard, '${crm.loyaltySummary['totalPoints']} pts', AppColors.warning),
          ]),
        ),
        const SizedBox(height: 8),
        // List
        Expanded(child: crm.customersLoading && crm.customers.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : crm.customers.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.people_outline, size: 64, color: AppColors.gray300),
                        const SizedBox(height: 12),
                        Text('No customers found', style: GoogleFonts.inter(color: AppColors.gray500)),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: crm.customers.length + (crm.customersLoading ? 1 : 0),
                    itemBuilder: (ctx, i) {
                      if (i >= crm.customers.length) return const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(strokeWidth: 2)));
                      final c = crm.customers[i];
                      final points = (c['loyaltyPoints'] as Map<String, dynamic>?)?['points'] ?? 0;
                      final balance = (c['wallet'] as Map<String, dynamic>?)?['balance'] ?? 0;
                      final orders = (c['_count'] as Map<String, dynamic>?)?['orders'] ?? 0;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                            child: Text((c['name'] ?? '')[0].toString().toUpperCase(), style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: AppColors.primary)),
                          ),
                          title: Text(c['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                          subtitle: Text('${c['phone'] ?? ''}  •  $orders orders  •  $points pts  •  ₹$balance', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                          trailing: const Icon(Icons.chevron_right, size: 18),
                          onTap: () => _showCustomerDetail(ctx, c['id']),
                        ),
                      );
                    },
                  ),
        ),
      ]),
    );
  }

  Widget _statChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
      ]),
    );
  }

  void _showCustomerDetail(BuildContext ctx, String id) {
    ref.read(crmProvider.notifier).selectCustomer(id);
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      builder: (_) => const _CustomerDetailSheet(),
    );
  }
}

class _CustomerDetailSheet extends ConsumerStatefulWidget {
  const _CustomerDetailSheet();
  @override
  ConsumerState<_CustomerDetailSheet> createState() => _CustomerDetailSheetState();
}

class _CustomerDetailSheetState extends ConsumerState<_CustomerDetailSheet> {
  final _noteCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final crm = ref.watch(crmProvider);
    final c = crm.selectedCustomer;
    if (c == null) return const SizedBox.shrink();
    final lp = c['loyaltyPoints'] as Map<String, dynamic>?;
    final w = c['wallet'] as Map<String, dynamic>?;
    final orders = (c['orders'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      builder: (ctx, scrollCtrl) => Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          color: Colors.white,
        ),
        child: ListView(
          controller: scrollCtrl,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.gray300, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            // Header
            Row(children: [
              CircleAvatar(radius: 30, backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text((c['name'] ?? '?')[0].toString().toUpperCase(), style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary))),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(c['name'] ?? '', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                if (c['phone'] != null) Text(c['phone'], style: GoogleFonts.inter(color: AppColors.gray500)),
                if (c['email'] != null) Text(c['email'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400)),
              ])),
            ]),
            const SizedBox(height: 20),
            // Stats cards
            Row(children: [
              _statCard('Orders', '${c['totalOrders'] ?? 0}', Icons.receipt_long, AppColors.primary),
              const SizedBox(width: 8),
              _statCard('Spent', '₹${(c['totalSpent'] ?? 0).toStringAsFixed(0)}', Icons.currency_rupee, AppColors.success),
              const SizedBox(width: 8),
              _statCard('Points', '${lp?['points'] ?? 0}', Icons.card_giftcard, AppColors.warning),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              _statCard('Wallet', '₹${(w?['balance'] ?? 0).toStringAsFixed(0)}', Icons.account_balance_wallet, AppColors.info),
              const SizedBox(width: 8),
              _statCard('Reviews', '${(c['_count'] as Map?)?['reviews'] ?? 0}', Icons.star, Colors.amber),
            ]),
            const SizedBox(height: 16),
            // Notes
            if (c['notes'] != null) ...[
              Text('Notes', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.gray50, borderRadius: BorderRadius.circular(8)),
                child: Text(c['notes'], style: GoogleFonts.inter(fontSize: 13)),
              ),
              const SizedBox(height: 12),
            ],
            // Recent orders
            if (orders.isNotEmpty) ...[
              Text('Recent Orders', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              ...orders.take(5).map((o) => ListTile(
                dense: true,
                title: Text('#${o['orderNumber']}', style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
                subtitle: Text(o['status'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                trailing: Text('₹${(o['totalAmount'] ?? 0).toStringAsFixed(0)}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              )),
            ],
          ],
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.gray500)),
        ]),
      ),
    );
  }

  @override
  void dispose() { _noteCtrl.dispose(); super.dispose(); }
}
