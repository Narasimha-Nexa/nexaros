import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/providers/branch_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';

class BranchManagementScreen extends ConsumerStatefulWidget {
  const BranchManagementScreen({super.key});

  @override
  ConsumerState<BranchManagementScreen> createState() => _BranchManagementScreenState();
}

class _BranchManagementScreenState extends ConsumerState<BranchManagementScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(branchProvider.notifier).loadBranches(selectDefault: false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Branches', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () => _showBranchDialog(context),
          ),
        ],
      ),
      body: Consumer(
        builder: (context, ref, _) {
          final bp = ref.watch(branchProvider);
          if (bp.isLoading && bp.branches.isEmpty) {
            return const Center(child: NxFullScreenLoader());
          }
          if (bp.branches.isEmpty) {
            return _buildEmptyState(context);
          }
          return _buildBranchList(context, bp);
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.store_outlined, size: 64, color: AppColors.gray300),
          const SizedBox(height: 16),
          Text('No branches yet', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.gray700)),
          const SizedBox(height: 8),
          Text('Create your first branch to get started', style: GoogleFonts.inter(color: AppColors.gray500)),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => _showBranchDialog(context),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Create Branch'),
          ),
        ],
      ),
    );
  }

  Widget _buildBranchList(BuildContext context, BranchProvider bp) {
    final currentBranchId = ref.read(appStateProvider).branchId;
    return RefreshIndicator(
      onRefresh: () => bp.loadBranches(selectDefault: false),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: bp.branches.length,
        itemBuilder: (context, index) {
          final branch = bp.branches[index];
          final isSelected = branch.id == currentBranchId;
          return _buildBranchCard(context, bp, branch, isSelected);
        },
      ),
    );
  }

  Widget _buildBranchCard(BuildContext context, BranchProvider bp, dynamic branch, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primary50 : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppColors.primary : AppColors.gray200,
          width: isSelected ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : AppColors.gray100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    branch.isPrimary ? Icons.star : Icons.store,
                    size: 20,
                    color: isSelected ? AppColors.primary : AppColors.gray500,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              branch.name,
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: AppColors.gray800,
                              ),
                            ),
                          ),
                          if (branch.isPrimary) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.warning.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'PRIMARY',
                                style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.warning),
                              ),
                            ),
                          ],
                          if (isSelected) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'ACTIVE',
                                style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.success),
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (branch.address != null && branch.address!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          branch.address!,
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      if (branch.phone != null && branch.phone!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          branch.phone!,
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray400),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                if (!isSelected)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => bp.selectBranch(branch),
                      icon: const Icon(Icons.check_circle_outline, size: 16),
                      label: const Text('Switch to'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: null,
                      icon: const Icon(Icons.check_circle, size: 16),
                      label: const Text('Current'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.success,
                        disabledForegroundColor: AppColors.success,
                        side: const BorderSide(color: AppColors.success),
                      ),
                    ),
                  ),
                const SizedBox(width: 8),
                if (!branch.isPrimary)
                  IconButton(
                    onPressed: () => _showEditDialog(context, bp, branch),
                    icon: const Icon(Icons.edit_outlined, size: 18),
                    color: AppColors.gray500,
                    tooltip: 'Edit',
                  ),
                if (!branch.isPrimary)
                  IconButton(
                    onPressed: () => _confirmDelete(context, bp, branch),
                    icon: const Icon(Icons.delete_outline, size: 18),
                    color: AppColors.danger,
                    tooltip: 'Delete',
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showBranchDialog(BuildContext context, {dynamic existing}) {
    final nameCtrl = TextEditingController(text: existing?.name ?? '');
    final addressCtrl = TextEditingController(text: existing?.address ?? '');
    final phoneCtrl = TextEditingController(text: existing?.phone ?? '');
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                existing != null ? 'Edit Branch' : 'New Branch',
                style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: nameCtrl,
                decoration: InputDecoration(
                  labelText: 'Branch Name',
                  hintText: 'e.g. Koramangala Branch',
                  prefixIcon: const Icon(Icons.store, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: addressCtrl,
                decoration: InputDecoration(
                  labelText: 'Address (optional)',
                  prefixIcon: const Icon(Icons.location_on_outlined, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                maxLines: 2,
                textCapitalization: TextCapitalization.sentences,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: phoneCtrl,
                decoration: InputDecoration(
                  labelText: 'Phone (optional)',
                  prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () async {
                  if (!formKey.currentState!.validate()) return;
                  final bp = ref.read(branchProvider.notifier);
                  final scaffold = ScaffoldMessenger.of(context);
                  try {
                    if (existing != null) {
                      await bp.updateBranch(
                        existing.id,
                        name: nameCtrl.text.trim(),
                        address: addressCtrl.text.trim(),
                        phone: phoneCtrl.text.trim(),
                      );
                    } else {
                      await bp.createBranch(
                        name: nameCtrl.text.trim(),
                        address: addressCtrl.text.trim().isNotEmpty ? addressCtrl.text.trim() : null,
                        phone: phoneCtrl.text.trim().isNotEmpty ? phoneCtrl.text.trim() : null,
                      );
                    }
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (mounted) {
                      scaffold.showSnackBar(
                        SnackBar(content: Text(existing != null ? 'Branch updated' : 'Branch created')),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      scaffold.showSnackBar(
                        SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
                      );
                    }
                  }
                },
                child: Text(existing != null ? 'Update' : 'Create'),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditDialog(BuildContext context, BranchProvider bp, dynamic branch) {
    _showBranchDialog(context, existing: branch);
  }

  void _confirmDelete(BuildContext context, BranchProvider bp, dynamic branch) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Branch?'),
        content: Text('Are you sure you want to delete "${branch.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final scaffold = ScaffoldMessenger.of(context);
              Navigator.pop(ctx);
              try {
                await bp.deleteBranch(branch.id);
                if (mounted) {
                  scaffold.showSnackBar(
                    const SnackBar(content: Text('Branch deleted')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  scaffold.showSnackBar(
                    SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.danger),
                  );
                }
              }
            },
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
