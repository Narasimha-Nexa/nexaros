/// Enterprise timeline widget for order tracking, activity feeds.
library;

import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class TimelineEvent {
  final String title;
  final String? subtitle;
  final DateTime timestamp;
  final IconData? icon;
  final Color? color;
  final bool isActive;
  final bool isCompleted;

  const TimelineEvent({
    required this.title,
    this.subtitle,
    required this.timestamp,
    this.icon,
    this.color,
    this.isActive = false,
    this.isCompleted = false,
  });
}

class NxTimeline extends StatelessWidget {
  final List<TimelineEvent> events;
  final bool showConnectors;
  final EdgeInsetsGeometry? padding;

  const NxTimeline({
    super.key,
    required this.events,
    this.showConnectors = true,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? EdgeInsets.zero,
      child: Column(
        children: List.generate(events.length, (i) {
          final event = events[i];
          final isLast = i == events.length - 1;
          return _buildEvent(context, event, isLast);
        }),
      ),
    );
  }

  Widget _buildEvent(
    BuildContext context,
    TimelineEvent event,
    bool isLast,
  ) {
    final cs = Theme.of(context).colorScheme;
    final eventColor =
        event.color ??
        (event.isActive
            ? cs.primary
            : event.isCompleted
                ? AppColors.success
                : cs.outline);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: event.isActive
                        ? eventColor.withAlpha(38)
                        : eventColor,
                    shape: BoxShape.circle,
                    border: event.isActive
                        ? Border.all(color: eventColor, width: 2)
                        : null,
                  ),
                  child: Icon(
                    event.icon ??
                        (event.isCompleted ? Icons.check : Icons.circle),
                    size: 12,
                    color: event.isActive ? eventColor : Colors.white,
                  ),
                ),
                if (!isLast && showConnectors)
                  Expanded(
                    child: Container(width: 2, color: cs.outlineVariant),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight:
                          event.isActive ? FontWeight.w600 : FontWeight.w500,
                      color: event.isActive
                          ? cs.onSurface
                          : cs.onSurfaceVariant,
                    ),
                  ),
                  if (event.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      event.subtitle!,
                      style: TextStyle(
                        fontSize: 11,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 2),
                  Text(
                    _formatTimestamp(event.timestamp),
                    style: TextStyle(fontSize: 10, color: cs.outline),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
