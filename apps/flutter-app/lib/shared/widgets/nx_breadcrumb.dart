/// Enterprise breadcrumb navigation widget.
library;

import 'package:flutter/material.dart';

class BreadcrumbItem {
  final String label;
  final String? route;
  final IconData? icon;
  final VoidCallback? onTap;

  const BreadcrumbItem({
    required this.label,
    this.route,
    this.icon,
    this.onTap,
  });
}

class NxBreadcrumb extends StatelessWidget {
  final List<BreadcrumbItem> items;
  final TextStyle? textStyle;
  final Color? activeColor;
  final Color? inactiveColor;
  final Widget? separator;

  const NxBreadcrumb({
    super.key,
    required this.items,
    this.textStyle,
    this.activeColor,
    this.inactiveColor,
    this.separator,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (int i = 0; i < items.length; i++) ...[
          if (i > 0)
            separator ??
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Icon(
                    Icons.chevron_right,
                    size: 16,
                    color: cs.outline,
                  ),
                ),
          _buildItem(context, items[i], i == items.length - 1),
        ],
      ],
    );
  }

  Widget _buildItem(BuildContext context, BreadcrumbItem item, bool isLast) {
    final cs = Theme.of(context).colorScheme;
    final color = isLast
        ? (activeColor ?? cs.primary)
        : (inactiveColor ?? cs.onSurfaceVariant);

    return GestureDetector(
      onTap: isLast ? null : item.onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (item.icon != null) ...[
            Icon(item.icon, size: 14, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            item.label,
            style: (textStyle ?? const TextStyle(fontSize: 13)).copyWith(
              color: color,
              fontWeight: isLast ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }
}
