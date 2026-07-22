import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/dashboard_models.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../../../core/utils/date_utils.dart' as app_date_utils;

class ExecutiveHeader extends StatelessWidget {
  final ExecutiveHeaderData header;
  final RealtimeState realtimeState;

  const ExecutiveHeader({super.key, required this.header, required this.realtimeState});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDesktop = MediaQuery.of(context).size.width > 1024;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppDimens.responsivePadding(context),
        vertical: AppDimens.md,
      ),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(bottom: BorderSide(color: cs.outline.withValues(alpha: 0.1))),
      ),
      child: isDesktop ? _buildDesktopHeader(context, cs) : _buildMobileHeader(context, cs),
    );
  }

  Widget _buildDesktopHeader(BuildContext context, ColorScheme cs) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _buildSyncIndicator(context),
                  const SizedBox(width: 8),
                  Text(
                    header.restaurantName,
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: cs.onSurface),
                  ),
                  if (header.branchName.isNotEmpty) ...[
                    Icon(Icons.chevron_right, size: 16, color: cs.outline),
                    Text(header.branchName, style: GoogleFonts.inter(fontSize: 14, color: cs.onSurfaceVariant)),
                  ],
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Text(
                    header.greeting,
                    style: GoogleFonts.inter(fontSize: 13, color: cs.onSurfaceVariant),
                  ),
                  const SizedBox(width: 12),
                  _InfoChip(icon: Icons.calendar_today, label: app_date_utils.DateUtils.formatDate(header.businessDate)),
                  const SizedBox(width: 8),
                  _InfoChip(icon: Icons.access_time, label: header.currentShift),
                  const SizedBox(width: 8),
                  _InfoChip(
                    icon: Icons.store,
                    label: header.isBusinessHoursOpen ? 'Open' : 'Closed',
                    color: header.isBusinessHoursOpen ? AppColors.success : AppColors.danger,
                  ),
                ],
              ),
            ],
          ),
        ),
        Row(
          children: [
            if (header.weather != null) ...[
              Icon(Icons.wb_sunny, size: 16, color: AppColors.warning),
              const SizedBox(width: 4),
              if (header.temperature != null)
                Text('${header.temperature!.toStringAsFixed(0)}°C', style: GoogleFonts.inter(fontSize: 12, color: cs.onSurfaceVariant)),
              const SizedBox(width: 12),
            ],
            _buildUserChip(context, cs),
          ],
        ),
      ],
    );
  }

  Widget _buildMobileHeader(BuildContext context, ColorScheme cs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _buildSyncIndicator(context),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                header.restaurantName,
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: cs.onSurface),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            _buildUserChip(context, cs),
          ],
        ),
        const SizedBox(height: 4),
        Text(header.greeting, style: GoogleFonts.inter(fontSize: 12, color: cs.onSurfaceVariant)),
        const SizedBox(height: 4),
        Row(
          children: [
            _InfoChip(icon: Icons.calendar_today, label: app_date_utils.DateUtils.formatDate(header.businessDate), small: true),
            const SizedBox(width: 6),
            _InfoChip(icon: Icons.access_time, label: header.currentShift, small: true),
            const SizedBox(width: 6),
            _InfoChip(
              icon: Icons.store, small: true,
              label: header.isBusinessHoursOpen ? 'Open' : 'Closed',
              color: header.isBusinessHoursOpen ? AppColors.success : AppColors.danger,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSyncIndicator(BuildContext context) {
    final isOnline = realtimeState.isConnected;
    return Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(
        color: isOnline ? AppColors.success : AppColors.danger,
        shape: BoxShape.circle,
        boxShadow: [BoxShadow(color: (isOnline ? AppColors.success : AppColors.danger).withValues(alpha: 0.4), blurRadius: 6, spreadRadius: 2)],
      ),
    );
  }

  Widget _buildUserChip(BuildContext context, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(AppDimens.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 12,
            backgroundColor: AppColors.primary.withValues(alpha: 0.15),
            child: Text(
              header.userName.isNotEmpty ? header.userName[0].toUpperCase() : 'O',
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary),
            ),
          ),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(header.userName, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600)),
              Text(header.userRole, style: GoogleFonts.inter(fontSize: 9, color: cs.onSurfaceVariant)),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? color;
  final bool small;

  const _InfoChip({required this.icon, required this.label, this.color, this.small = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final c = color ?? cs.onSurfaceVariant;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: small ? 6 : 8, vertical: small ? 2 : 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppDimens.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: small ? 10 : 12, color: c),
          const SizedBox(width: 3),
          Text(label, style: GoogleFonts.inter(fontSize: small ? 9 : 10, fontWeight: FontWeight.w500, color: c)),
        ],
      ),
    );
  }
}
