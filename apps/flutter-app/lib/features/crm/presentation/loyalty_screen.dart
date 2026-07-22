import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/require_permission.dart';
import '../../../core/models/user_role.dart';

class LoyaltyScreen extends ConsumerStatefulWidget {
  const LoyaltyScreen({super.key});
  @override
  ConsumerState<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends ConsumerState<LoyaltyScreen> {
  @override
  void initState() { super.initState(); ref.read(crmProvider.notifier).loadLoyaltySummary(); }

  @override
  Widget build(BuildContext context) {
    final crm = ref.watch(crmProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text('Loyalty Program', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary, foregroundColor: Colors.white,
        actions: [
          RequirePermission(permission: Permission.manageLoyaltyProgram,
            child: IconButton(icon: const Icon(Icons.add), onPressed: () => _showTierDialog(context)),
          ),
        ],
      ),
      body: crm.loyaltyLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Summary card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [AppColors.warning, AppColors.warning.withValues(alpha: 0.8)]),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(children: [
                    const Icon(Icons.card_giftcard, size: 40, color: Colors.white),
                    const SizedBox(height: 8),
                    Text('Total Points Issued', style: GoogleFonts.inter(color: Colors.white70, fontSize: 13)),
                    Text('${crm.loyaltySummary['totalPoints'] ?? 0}', style: GoogleFonts.inter(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 8),
                    Text('${crm.loyaltySummary['activeCustomers'] ?? 0} active customers', style: GoogleFonts.inter(color: Colors.white70)),
                  ]),
                ),
                const SizedBox(height: 20),
                // Tiers section
                Text('Membership Tiers', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                if (crm.tiers.isEmpty)
                  Center(child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Text('No tiers configured. Create your first tier.', style: GoogleFonts.inter(color: AppColors.gray500)),
                  ))
                else
                  ...crm.tiers.map((tier) => _buildTierCard(tier)),
              ],
            ),
    );
  }

  Widget _buildTierCard(Map<String, dynamic> tier) {
    final color = _parseColor(tier['color'] as String? ?? '#64748b');
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(backgroundColor: color.withValues(alpha: 0.15), child: Icon(Icons.card_membership, color: color, size: 20)),
        title: Text(tier['name'] ?? '', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        subtitle: Text('Min ₹${tier['minSpent'] ?? 0}  •  ${tier['discountPct'] ?? 0}% off  •  ${tier['pointsMultiplier'] ?? 1}x pts', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          if (tier['isActive'] == true)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
              child: Text('Active', style: GoogleFonts.inter(fontSize: 10, color: AppColors.success)),
            ),
          const SizedBox(width: 4),
          RequirePermission(permission: Permission.manageLoyaltyProgram,
            child: IconButton(icon: const Icon(Icons.edit, size: 18), onPressed: () => _showTierDialog(context, tier: tier)),
          ),
        ]),
      ),
    );
  }

  void _showTierDialog(BuildContext ctx, {Map<String, dynamic>? tier}) {
    final nameCtrl = TextEditingController(text: tier?['name'] ?? '');
    final minSpentCtrl = TextEditingController(text: tier?['minSpent']?.toString() ?? '');
    final discCtrl = TextEditingController(text: tier?['discountPct']?.toString() ?? '');
    final multCtrl = TextEditingController(text: tier?['pointsMultiplier']?.toString() ?? '1');
    showDialog(
      context: ctx,
      builder: (dCtx) => AlertDialog(
        title: Text(tier != null ? 'Edit Tier' : 'New Tier'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name', border: OutlineInputBorder())),
            const SizedBox(height: 8),
            TextField(controller: minSpentCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Min Spent (₹)', border: OutlineInputBorder())),
            const SizedBox(height: 8),
            TextField(controller: discCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Discount %', border: OutlineInputBorder())),
            const SizedBox(height: 8),
            TextField(controller: multCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Points Multiplier', border: OutlineInputBorder())),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel')),
          TextButton(onPressed: () async {
            final data = {
              'name': nameCtrl.text.trim(),
              'minSpent': double.tryParse(minSpentCtrl.text) ?? 0,
              'discountPct': double.tryParse(discCtrl.text) ?? 0,
              'pointsMultiplier': double.tryParse(multCtrl.text) ?? 1,
              'isActive': true,
            };
            if (tier != null) {
              await ref.read(crmProvider.notifier).updateTier(tier['id'], data);
            } else {
              await ref.read(crmProvider.notifier).createTier(data);
            }
            if (dCtx.mounted) Navigator.pop(dCtx);
          }, child: Text(tier != null ? 'Update' : 'Create', style: TextStyle(color: AppColors.primary))),
        ],
      ),
    );
  }

  Color _parseColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    return Color(int.parse(hex, radix: 16));
  }
}
