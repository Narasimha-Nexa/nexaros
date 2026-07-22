import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../features/delivery/providers/delivery_provider.dart';

class DeliveryPartnersScreen extends ConsumerStatefulWidget {
  const DeliveryPartnersScreen({super.key});

  @override
  ConsumerState<DeliveryPartnersScreen> createState() => _DeliveryPartnersScreenState();
}

class _DeliveryPartnersScreenState extends ConsumerState<DeliveryPartnersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(deliveryProvider.notifier).loadPartners();
    });
  }

  @override
  Widget build(BuildContext context) {
    final delivery = ref.watch(deliveryProvider);
    final partners = delivery.partners;
    final isLoading = delivery.partnersLoading;
    final error = delivery.partnersError;

    return Scaffold(
      appBar: AppBar(
        title: Text('Delivery Partners', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.info,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => delivery.loadPartners(),
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showPartnerDialog(context, delivery),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => delivery.loadPartners(),
        child: _buildBody(context, delivery, partners, isLoading, error),
      ),
    );
  }

  Widget _buildBody(BuildContext context, DeliveryProvider delivery, List<Map<String, dynamic>> partners, bool isLoading, String? error) {
    if (isLoading && partners.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (error != null && partners.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 48, color: AppColors.danger),
            const SizedBox(height: 12),
            Text('Failed to load partners', style: GoogleFonts.inter(fontSize: 16, color: AppColors.gray600)),
            const SizedBox(height: 8),
            Text(error, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => delivery.loadPartners(),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }
    if (partners.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_shipping, size: 64, color: AppColors.gray300),
            const SizedBox(height: 16),
            Text('No delivery partners', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.gray500)),
            const SizedBox(height: 8),
            Text('Add your first delivery partner to get started',
                style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray400)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => _showPartnerDialog(context, delivery),
              icon: const Icon(Icons.add),
              label: const Text('Add Partner'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.info, foregroundColor: Colors.white),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: partners.length,
      itemBuilder: (ctx, i) {
        final partner = partners[i];
        final name = partner['name'] ?? 'Unknown';
        final phone = partner['phone'] ?? '-';
        final vehicle = partner['vehicleType'] ?? partner['vehicle'] ?? '-';
        final isActive = partner['isActive'] != false;
        final status = partner['status'] as String? ?? (isActive ? 'AVAILABLE' : 'OFFLINE');
        final currentDeliveries = partner['currentDeliveries'] ?? 0;
        final rating = partner['rating'];
        final totalDeliveries = partner['totalDeliveries'] ?? 0;

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
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isActive ? AppColors.success.withValues(alpha: 0.1) : AppColors.gray100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.person, color: isActive ? AppColors.success : AppColors.gray400, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(Icons.phone, size: 12, color: AppColors.gray400),
                              const SizedBox(width: 4),
                              Text(phone, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                              const SizedBox(width: 12),
                              Icon(Icons.directions_car, size: 12, color: AppColors.gray400),
                              const SizedBox(width: 4),
                              Text(vehicle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor(status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(_statusLabel(status), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: _statusColor(status))),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _miniStat(Icons.receipt_long, '$currentDeliveries active', AppColors.info),
                    const SizedBox(width: 16),
                    _miniStat(Icons.star, rating != null ? rating.toString() : '-', AppColors.warning),
                    const SizedBox(width: 16),
                    _miniStat(Icons.done_all, '$totalDeliveries total', AppColors.success),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () => _showPartnerDialog(context, delivery, partner: partner),
                      icon: const Icon(Icons.edit, size: 16),
                      label: const Text('Edit'),
                      style: TextButton.styleFrom(foregroundColor: AppColors.info),
                    ),
                    const SizedBox(width: 4),
                    Switch(
                      value: isActive,
                      onChanged: (v) => _toggleActive(context, delivery, partner, v),
                      activeTrackColor: AppColors.success,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
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

  Widget _miniStat(IconData icon, String text, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 4),
        Text(text, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
      ],
    );
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return AppColors.success;
      case 'BUSY':
        return AppColors.warning;
      case 'OFFLINE':
        return AppColors.gray500;
      default:
        return AppColors.gray500;
    }
  }

  String _statusLabel(String status) {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'Available';
      case 'BUSY':
        return 'Busy';
      case 'OFFLINE':
        return 'Offline';
      default:
        return status;
    }
  }

  Future<void> _toggleActive(BuildContext context, DeliveryProvider delivery, Map<String, dynamic> partner, bool isActive) async {
    final snackMessenger = ScaffoldMessenger.of(context);
    final success = await delivery.updatePartner(partner['id'] ?? '', {'isActive': isActive});
    if (success == null) {
      if (!mounted) return;
      snackMessenger.showSnackBar(
        SnackBar(content: Text('Failed to update partner status'), backgroundColor: AppColors.danger),
      );
    }
  }

  Future<void> _showPartnerDialog(BuildContext context, DeliveryProvider delivery, {Map<String, dynamic>? partner}) async {
    final isEdit = partner != null;
    final nameCtrl = TextEditingController(text: partner?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: partner?['phone'] ?? '');
    final emailCtrl = TextEditingController(text: partner?['email'] ?? '');
    final vehicleCtrl = TextEditingController(text: partner?['vehicleType'] ?? partner?['vehicle'] ?? '');

    String status = partner?['status'] ?? 'AVAILABLE';

    final snackMessenger = ScaffoldMessenger.of(context);
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text(isEdit ? 'Edit Partner' : 'Add Partner', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()),
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: emailCtrl,
                  decoration: const InputDecoration(labelText: 'Email (optional)', border: OutlineInputBorder()),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: vehicleCtrl,
                  decoration: const InputDecoration(labelText: 'Vehicle Type', hintText: 'e.g. Bike, Car, Scooter', border: OutlineInputBorder()),
                ),
                if (!isEdit) ...[
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: status,
                    decoration: const InputDecoration(labelText: 'Status', border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'AVAILABLE', child: Text('Available')),
                      DropdownMenuItem(value: 'BUSY', child: Text('Busy')),
                      DropdownMenuItem(value: 'OFFLINE', child: Text('Offline')),
                    ],
                    onChanged: (v) => setDialogState(() => status = v ?? 'AVAILABLE'),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.gray500)),
            ),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty) return;
                final data = <String, dynamic>{
                  'name': nameCtrl.text.trim(),
                  'phone': phoneCtrl.text.trim(),
                  if (emailCtrl.text.trim().isNotEmpty) 'email': emailCtrl.text.trim(),
                  'vehicleType': vehicleCtrl.text.trim().isNotEmpty ? vehicleCtrl.text.trim() : 'Bike',
                  if (!isEdit) 'status': status,
                };
                final success = isEdit
                    ? await delivery.updatePartner(partner['id'], data)
                    : await delivery.createPartner(data);
                if (ctx.mounted) {
                  Navigator.of(ctx).pop(success != null);
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.info, foregroundColor: Colors.white),
              child: Text(isEdit ? 'Update' : 'Add'),
            ),
          ],
        ),
      ),
    );

    if (result == true) {
      if (!mounted) return;
      snackMessenger.showSnackBar(
        SnackBar(
          content: Text(isEdit ? 'Partner updated' : 'Partner added'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }
}
