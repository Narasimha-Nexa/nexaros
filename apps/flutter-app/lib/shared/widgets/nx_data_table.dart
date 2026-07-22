import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_dimens.dart';
import 'nx_empty_state.dart';

/// Responsive data table that adapts to screen width.
/// On mobile, falls back to a card-list layout.
class NxDataTable<T> extends StatelessWidget {
  final List<T> items;
  final List<NxDataColumn<T>> columns;
  final Widget Function(T item)? mobileCardBuilder;
  final VoidCallback? onRefresh;
  final String emptyTitle;
  final String? emptySubtitle;
  final IconData emptyIcon;
  final bool isLoading;

  const NxDataTable({
    super.key,
    required this.items,
    required this.columns,
    this.mobileCardBuilder,
    this.onRefresh,
    this.emptyTitle = 'No data found',
    this.emptySubtitle,
    this.emptyIcon = Icons.table_chart_outlined,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (items.isEmpty) {
      return NxEmptyState(
        icon: emptyIcon,
        title: emptyTitle,
        subtitle: emptySubtitle,
      );
    }

    final isMobile = MediaQuery.sizeOf(context).width < AppDimens.mobileMax;

    if (isMobile && mobileCardBuilder != null) {
      return RefreshIndicator(
        onRefresh: () async => onRefresh?.call(),
        child: ListView.builder(
          padding: const EdgeInsets.all(AppDimens.sm),
          itemCount: items.length,
          itemBuilder: (ctx, i) => mobileCardBuilder!(items[i]),
        ),
      );
    }

    // Desktop / tablet: actual DataTable
    return RefreshIndicator(
      onRefresh: () async => onRefresh?.call(),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: SingleChildScrollView(
          child: DataTable(
            columnSpacing: AppDimens.base,
            headingRowColor: WidgetStateProperty.all(
              Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkSurfaceElevated
                  : AppColors.gray50,
            ),
            columns: columns
                .map((col) => DataColumn(
                      label: Text(col.label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.gray500)),
                      numeric: col.numeric,
                    ))
                .toList(),
            rows: items
                .map((item) => DataRow(
                      cells: columns
                          .map((col) => DataCell(col.buildCell(item)))
                          .toList(),
                    ))
                .toList(),
          ),
        ),
      ),
    );
  }
}

class NxDataColumn<T> {
  final String label;
  final bool numeric;
  final Widget Function(T item) buildCell;

  const NxDataColumn({
    required this.label,
    this.numeric = false,
    required this.buildCell,
  });
}
