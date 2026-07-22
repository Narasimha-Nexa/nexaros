import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../data/kitchen_models.dart';

class KitchenOrderCard extends StatelessWidget {
  final KitchenOrder order;
  final bool isTvMode;
  final bool isSelected;
  final VoidCallback onSelect;
  final void Function(KitchenOrderStatus) onStatusChange;
  final void Function(String itemId, KitchenOrderStatus) onItemStatusChange;
  final VoidCallback onBump;
  final VoidCallback onRush;
  final VoidCallback onHold;
  final VoidCallback onRecall;
  final void Function(String chefId, String chefName) onAssignChef;
  final void Function(CourseType) onFireCourse;
  final KitchenSLAConfig slaConfig;

  const KitchenOrderCard({
    super.key,
    required this.order,
    this.isTvMode = false,
    this.isSelected = false,
    required this.onSelect,
    required this.onStatusChange,
    required this.onItemStatusChange,
    required this.onBump,
    required this.onRush,
    required this.onHold,
    required this.onRecall,
    required this.onAssignChef,
    required this.onFireCourse,
    required this.slaConfig,
  });

  @override
  Widget build(BuildContext context) {
    final elapsed = order.age;
    final elapsedMins = elapsed.inMinutes;
    final isDelayed = order.isDelayed;
    final isUrgent = order.isUrgent;
    final cs = Theme.of(context).colorScheme;

    final cardBg = isTvMode
        ? (isSelected ? Colors.orange.shade900.withValues(alpha: 0.5) : Colors.grey.shade900)
        : Theme.of(context).colorScheme.surface;

    final borderColor = isSelected
        ? Colors.orange
        : isDelayed
            ? AppColors.danger
            : isUrgent
                ? Colors.red
                : (isTvMode ? Colors.white10 : cs.outline.withValues(alpha: 0.1));

    return Card(
      elevation: isTvMode ? 0 : 1,
      color: cardBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(isTvMode ? 12 : AppDimens.cardRadius),
        side: BorderSide(color: borderColor, width: isDelayed || isSelected ? 2.0 : 1.0),
      ),
      child: InkWell(
        onTap: onSelect,
        borderRadius: BorderRadius.circular(isTvMode ? 12 : AppDimens.cardRadius),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _buildHeader(context, elapsedMins, isDelayed, isUrgent),
          if (order.allergenWarning != null || order.isVip)
            _buildAlertBanner(),
          Expanded(child: _buildItemsList()),
          _buildFooter(),
        ]),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, int elapsedMins, bool isDelayed, bool isUrgent) {
    final cs = Theme.of(context).colorScheme;
    final headerColor = isDelayed
        ? AppColors.danger.withValues(alpha: isTvMode ? 0.3 : 0.1)
        : isUrgent
            ? Colors.red.withValues(alpha: isTvMode ? 0.2 : 0.1)
            : (isTvMode ? Colors.white10 : null);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: headerColor,
        borderRadius: BorderRadius.vertical(top: Radius.circular(isTvMode ? 12 : AppDimens.cardRadius)),
      ),
      child: Row(children: [
        // Order number
        Text(order.displayOrderNumber, style: GoogleFonts.inter(
          fontSize: isTvMode ? 18 : 14, fontWeight: FontWeight.w800,
          color: isTvMode ? Colors.white : null)),
        const SizedBox(width: 6),
        // Channel badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
          decoration: BoxDecoration(
            color: _channelColor.withValues(alpha: isTvMode ? 0.3 : 0.1),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(order.channel, style: GoogleFonts.inter(
            fontSize: 9, fontWeight: FontWeight.w600,
            color: isTvMode ? Colors.white70 : _channelColor)),
        ),
        // Priority badge
        if (order.priority.level > KitchenPriority.normal.level)
          Container(
            margin: const EdgeInsets.only(left: 4),
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
            decoration: BoxDecoration(
              color: order.priority.color.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(order.isRush ? Icons.bolt : Icons.flag, size: 10, color: order.priority.color),
              const SizedBox(width: 2),
              Text(order.priority.label, style: GoogleFonts.inter(
                fontSize: 9, fontWeight: FontWeight.w700, color: order.priority.color)),
            ]),
          ),
        const Spacer(),
        // Table
        if (order.displayTable.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: isTvMode ? 0.3 : 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(order.displayTable, style: GoogleFonts.inter(
              fontSize: isTvMode ? 13 : 10, fontWeight: FontWeight.w700,
              color: isTvMode ? Colors.white : AppColors.primary)),
          ),
        const SizedBox(width: 6),
        // Timer
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: isDelayed ? AppColors.danger : (isTvMode ? Colors.white24 : cs.surface),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (isDelayed) ...[
              const Icon(Icons.warning, size: 12, color: Colors.white),
              const SizedBox(width: 3),
            ],
            Text(order.ageDisplay, style: TextStyle(
              fontFamily: 'monospace',
              fontSize: isTvMode ? 14 : 11, fontWeight: FontWeight.w800,
              color: isDelayed ? Colors.white : (isTvMode ? Colors.white70 : null),
            )),
          ]),
        ),
      ]),
    );
  }

  Color get _channelColor {
    switch (order.channel.toLowerCase()) {
      case 'swiggy': return const Color(0xFFFC8019);
      case 'zomato': return const Color(0xFFE23744);
      case 'qr': return const Color(0xFF8B5CF6);
      case 'app': return const Color(0xFF06B6D4);
      default: return AppColors.primary;
    }
  }

  Widget _buildAlertBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      color: AppColors.danger.withValues(alpha: 0.1),
      child: Row(children: [
        if (order.allergenWarning != null) ...[
          const Icon(Icons.warning_amber, size: 12, color: AppColors.danger),
          const SizedBox(width: 4),
          Expanded(child: Text('Allergen: ${order.allergenWarning}', style: GoogleFonts.inter(
            fontSize: 10, color: AppColors.danger, fontWeight: FontWeight.w600),
            maxLines: 1, overflow: TextOverflow.ellipsis)),
        ],
        if (order.isVip) ...[
          Icon(Icons.star, size: 12, color: Colors.amber[600]),
          const SizedBox(width: 4),
          Text('VIP', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.amber[600])),
        ],
      ]),
    );
  }

  Widget _buildItemsList() {
    final cs = isTvMode ? ColorScheme.dark() : ColorScheme.light();
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      itemCount: order.items.length,
      separatorBuilder: (_, __) => Divider(height: 1, color: isTvMode ? Colors.white10 : Colors.grey[200]),
      itemBuilder: (ctx, idx) {
        final item = order.items[idx];
        return _buildItemTile(item, cs);
      },
    );
  }

  Widget _buildItemTile(KitchenOrderItem item, ColorScheme cs) {
    final isItemDone = item.status == KitchenOrderStatus.ready ||
        item.status == KitchenOrderStatus.served ||
        item.status == KitchenOrderStatus.completed;

    return InkWell(
      onTap: () {
        if (item.status == KitchenOrderStatus.pending) {
          onItemStatusChange(item.id ?? '', KitchenOrderStatus.preparing);
        } else if (item.status == KitchenOrderStatus.preparing || item.status == KitchenOrderStatus.cooking) {
          onItemStatusChange(item.id ?? '', KitchenOrderStatus.ready);
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(children: [
          // Status indicator
          Container(
            width: isTvMode ? 28 : 22,
            height: isTvMode ? 28 : 22,
            decoration: BoxDecoration(
              color: item.status.color.withValues(alpha: isTvMode ? 0.3 : 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Center(child: isItemDone
                ? Icon(Icons.check, size: isTvMode ? 16 : 12, color: AppColors.success)
                : Text('${item.quantity}', style: GoogleFonts.inter(
                    fontSize: isTvMode ? 13 : 10, fontWeight: FontWeight.w800,
                    color: isTvMode ? Colors.white : item.status.color))),
          ),
          const SizedBox(width: 6),
          // Veg indicator
          if (item.isVeg) ...[
            Container(
              width: 8, height: 8,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.success, width: 1.5),
                borderRadius: BorderRadius.circular(2),
              ),
              child: Container(
                width: 4, height: 4, margin: const EdgeInsets.all(1),
                decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
              ),
            ),
            const SizedBox(width: 4),
          ],
          // Name + modifiers
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.name, style: GoogleFonts.inter(
                fontSize: isTvMode ? 14 : 12, fontWeight: FontWeight.w600,
                color: isTvMode ? Colors.white : null,
                decoration: isItemDone ? TextDecoration.lineThrough : null,
                decorationColor: Colors.grey,
              )),
              if (item.modifiers.isNotEmpty)
                Text(item.modifiers.join(', '), style: GoogleFonts.inter(
                  fontSize: 10, color: isTvMode ? Colors.white38 : Colors.grey[500]),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
              if (item.notes != null && item.notes!.isNotEmpty)
                Row(children: [
                  const Icon(Icons.notes, size: 10, color: AppColors.warning),
                  const SizedBox(width: 2),
                  Expanded(child: Text(item.notes!, style: GoogleFonts.inter(
                    fontSize: 10, color: AppColors.warning, fontStyle: FontStyle.italic),
                    maxLines: 1, overflow: TextOverflow.ellipsis)),
                ]),
              if (item.allergens.isNotEmpty)
                Row(children: [
                  const Icon(Icons.warning_amber, size: 10, color: AppColors.danger),
                  const SizedBox(width: 2),
                  Text(item.allergens.join(', '), style: GoogleFonts.inter(
                    fontSize: 10, color: AppColors.danger, fontWeight: FontWeight.w500)),
                ]),
            ],
          )),
          // Chef assignment
          if (item.chefName != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(item.chefName!, style: GoogleFonts.inter(fontSize: 9, color: AppColors.primary)),
            ),
          // Item timer
          if (item.startedAt != null) ...[
            const SizedBox(width: 4),
            Text(item.elapsed.inMinutes.toString(), style: TextStyle(
              fontFamily: 'monospace',
              fontSize: 10, color: isTvMode ? Colors.white38 : Colors.grey,
            )),
          ],
          // Status action button
          const SizedBox(width: 4),
          _ItemStatusChip(item: item, isTvMode: isTvMode),
        ]),
      ),
    );
  }

  Widget _buildFooter() {
    final bgColor = isTvMode ? Colors.white10 : null;
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(isTvMode ? 12 : AppDimens.cardRadius)),
      ),
      child: Row(children: [
        // Chef info
        if (order.assignedChefName != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.person, size: 12, color: AppColors.primary),
              const SizedBox(width: 3),
              Text(order.assignedChefName!, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primary)),
            ]),
          ),
        const Spacer(),
        // Course info
        if (order.courseCount > 1)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text('Course ${order.firedCourseIndex + 1}/${order.courseCount}', style: GoogleFonts.inter(
              fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.warning)),
          ),
        const SizedBox(width: 6),
        // Action buttons
        if (isTvMode) ...[
          _ActionBtn('BUMP', Icons.check_circle, AppColors.success, onBump),
          const SizedBox(width: 6),
          _ActionBtn('RUSH', Icons.bolt, Colors.red, onRush),
          const SizedBox(width: 6),
          _ActionBtn('HOLD', Icons.pause, AppColors.warning, onHold),
        ] else ...[
          if (order.status.canTransitionTo(KitchenOrderStatus.ready))
            _SmallBtn('Ready', AppColors.success, onBump),
          if (order.status.canStart) ...[
            const SizedBox(width: 4),
            _SmallBtn('Start', AppColors.warning, () => onStatusChange(KitchenOrderStatus.preparing)),
          ],
          const SizedBox(width: 4),
          IconButton(
            onPressed: onRush,
            icon: Icon(Icons.bolt, size: 16, color: isTvMode ? Colors.red : AppColors.warning),
            tooltip: 'Rush',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ]),
    );
  }
}

// ─── Item Status Chip ───

class _ItemStatusChip extends StatelessWidget {
  final KitchenOrderItem item;
  final bool isTvMode;
  const _ItemStatusChip({required this.item, this.isTvMode = false});

  @override
  Widget build(BuildContext context) {
    String label;
    Color color;
    switch (item.status) {
      case KitchenOrderStatus.pending:
        label = 'Start'; color = KitchenOrderStatus.pending.color;
      case KitchenOrderStatus.preparing:
      case KitchenOrderStatus.cooking:
        label = 'Done'; color = KitchenOrderStatus.ready.color;
      case KitchenOrderStatus.ready:
        label = '✓'; color = AppColors.success;
      default:
        label = item.status.label; color = item.status.color;
    }
    return Container(
      padding: EdgeInsets.symmetric(horizontal: isTvMode ? 10 : 6, vertical: isTvMode ? 4 : 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isTvMode ? 0.3 : 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(label, style: GoogleFonts.inter(
        fontSize: isTvMode ? 12 : 10, fontWeight: FontWeight.w700, color: color)),
    );
  }
}

// ─── Action Button (TV mode) ───

class _ActionBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _ActionBtn(this.label, this.icon, this.color, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: color.withValues(alpha: 0.4)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: color, letterSpacing: 0.5)),
        ]),
      ),
    );
  }
}

// ─── Small Button ───

class _SmallBtn extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _SmallBtn(this.label, this.color, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
      ),
    );
  }
}
