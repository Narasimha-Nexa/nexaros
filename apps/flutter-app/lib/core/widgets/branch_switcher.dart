import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/riverpod_providers.dart';
import '../theme/app_colors.dart';

class BranchSwitcher extends ConsumerWidget {
  const BranchSwitcher({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bp = ref.watch(branchProvider);
    if (bp.branches.isEmpty) return const SizedBox.shrink();
    if (!bp.hasMultipleBranches) {
      return _buildSingleBranch(context, bp);
    }
    return _buildDropdown(context, bp, ref);
  }

  Widget _buildSingleBranch(BuildContext context, bp) {
    final branch = bp.selectedBranch;
    if (branch == null) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primary50,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.store, size: 16, color: AppColors.primary),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              branch.name,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown(BuildContext context, bp, WidgetRef ref) {
    final current = bp.selectedBranch ?? bp.branches.first;
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: cs.outline),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: current.id,
          isDense: true,
          icon: Icon(Icons.keyboard_arrow_down, color: AppColors.gray500, size: 18),
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: cs.onSurface,
          ),
          items: bp.branches.map((branch) {
            return DropdownMenuItem<String>(
              value: branch.id,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    branch.isPrimary ? Icons.star : Icons.store,
                    size: 14,
                    color: branch.isPrimary ? AppColors.warning : AppColors.gray400,
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      branch.name,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
          onChanged: (branchId) {
            if (branchId == null) return;
            final branch = bp.branches.firstWhere((b) => b.id == branchId);
            ref.read(branchProvider.notifier).selectBranch(branch);
          },
        ),
      ),
    );
  }
}
