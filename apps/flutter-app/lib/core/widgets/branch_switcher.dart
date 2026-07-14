import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/branch_provider.dart';
import '../theme/app_colors.dart';

class BranchSwitcher extends StatelessWidget {
  const BranchSwitcher({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<BranchProvider>(
      builder: (context, branchProvider, _) {
        if (branchProvider.branches.isEmpty) return const SizedBox.shrink();
        if (!branchProvider.hasMultipleBranches) {
          return _buildSingleBranch(context, branchProvider);
        }
        return _buildDropdown(context, branchProvider);
      },
    );
  }

  Widget _buildSingleBranch(BuildContext context, BranchProvider bp) {
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

  Widget _buildDropdown(BuildContext context, BranchProvider bp) {
    final current = bp.selectedBranch ?? bp.branches.first;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.gray200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: current.id,
          isDense: true,
          icon: Icon(Icons.keyboard_arrow_down, color: AppColors.gray500, size: 18),
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.gray800,
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
            bp.selectBranch(branch);
          },
        ),
      ),
    );
  }
}
