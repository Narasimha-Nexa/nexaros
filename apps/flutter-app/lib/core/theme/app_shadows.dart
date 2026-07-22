import 'package:flutter/material.dart';

/// NexaROS elevation & shadow tokens.
class AppShadows {
  AppShadows._();

  static const none = <BoxShadow>[];

  static const xs = [
    BoxShadow(color: Color(0x0A000000), blurRadius: 2, offset: Offset(0, 1)),
  ];

  static const sm = [
    BoxShadow(color: Color(0x0D000000), blurRadius: 4, offset: Offset(0, 1)),
    BoxShadow(color: Color(0x0A000000), blurRadius: 2, offset: Offset(0, 1)),
  ];

  static const md = [
    BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, 2)),
    BoxShadow(color: Color(0x0A000000), blurRadius: 3, offset: Offset(0, 1)),
  ];

  static const lg = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 15, offset: Offset(0, 4)),
    BoxShadow(color: Color(0x0F000000), blurRadius: 6, offset: Offset(0, 2)),
  ];

  static const xl = [
    BoxShadow(color: Color(0x1F000000), blurRadius: 25, offset: Offset(0, 8)),
    BoxShadow(color: Color(0x14000000), blurRadius: 10, offset: Offset(0, 4)),
  ];

  /// Dark-mode-friendly shadow (uses a semi-transparent dark tint)
  static List<BoxShadow> colored(Color color, {double opacity = 0.15}) => [
    BoxShadow(color: color.withValues(alpha: opacity), blurRadius: 12, offset: const Offset(0, 4)),
  ];
}
