import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:nexaros_app/shared/widgets/shared_widgets.dart';
import '../../data/order_models.dart';

class OrderTimeline extends StatelessWidget {
  final List<OrderStatusHistory> history;
  final OrderStatus currentStatus;
  const OrderTimeline({super.key, required this.history, required this.currentStatus});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final entries = List<OrderStatusHistory>.from(history)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    if (entries.isEmpty) {
      return NxCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Timeline', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('No status history available', style: GoogleFonts.inter(
            fontSize: 12, color: cs.onSurfaceVariant.withValues(alpha: 0.6))),
        ]),
      );
    }

    return NxCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Timeline', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        ...entries.asMap().entries.map((e) {
          final entry = e.value;
          final isLast = e.key == entries.length - 1;
          final status = entry.status;

          return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Column(children: [
              Container(
                width: 10, height: 10,
                decoration: BoxDecoration(
                  color: status.color,
                  shape: BoxShape.circle,
                  border: isLast ? Border.all(color: status.color, width: 2) : null,
                ),
              ),
              if (!isLast)
                Container(width: 1.5, height: 32, color: cs.outline.withValues(alpha: 0.2)),
            ]),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(status.label, style: GoogleFonts.inter(
                fontSize: 12, fontWeight: isLast ? FontWeight.w600 : FontWeight.w500)),
              if (entry.notes != null)
                Text(entry.notes!, style: GoogleFonts.inter(
                  fontSize: 11, color: cs.onSurfaceVariant.withValues(alpha: 0.7))),
              Row(children: [
                if (entry.createdBy != null)
                  Text(entry.createdBy!, style: GoogleFonts.inter(
                    fontSize: 10, color: cs.onSurfaceVariant.withValues(alpha: 0.5))),
                if (entry.createdBy != null) const SizedBox(width: 6),
                Text(_formatTime(entry.timestamp), style: GoogleFonts.inter(
                  fontSize: 10, color: cs.onSurfaceVariant.withValues(alpha: 0.5))),
              ]),
              const SizedBox(height: 4),
            ])),
          ]);
        }),
      ]),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
