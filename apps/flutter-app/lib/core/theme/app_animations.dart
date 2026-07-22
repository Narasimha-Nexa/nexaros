/// Centralized animation utilities that respect accessibility reduce-motion.
library;

import 'package:flutter/material.dart';

/// Duration presets used across the app.
class AppDurations {
  static const Duration instant = Duration(milliseconds: 0);
  static const Duration fast = Duration(milliseconds: 150);
  static const Duration normal = Duration(milliseconds: 250);
  static const Duration slow = Duration(milliseconds: 400);
  static const Duration verySlow = Duration(milliseconds: 600);
}

/// Get the effective duration, respecting reduce-motion.
Duration effectiveDuration(Duration base, {required bool reduceMotion}) {
  return reduceMotion ? Duration.zero : base;
}

/// Standard page transition that respects reduce-motion.
class AppPageRoute<T> extends PageRouteBuilder<T> {
  final WidgetBuilder builder;
  final bool reduceMotion;

  AppPageRoute({
    required this.builder,
    this.reduceMotion = false,
    super.settings,
  }) : super(
          pageBuilder: (context, animation, secondaryAnimation) =>
              builder(context),
          transitionDuration: effectiveDuration(
            AppDurations.normal,
            reduceMotion: reduceMotion,
          ),
          reverseTransitionDuration: effectiveDuration(
            AppDurations.fast,
            reduceMotion: reduceMotion,
          ),
          transitionsBuilder: reduceMotion
              ? (context, animation, secondaryAnimation, child) => child
              : (context, animation, secondaryAnimation, child) {
                  return FadeTransition(
                    opacity: CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeOut,
                    ),
                    child: child,
                  );
                },
        );
}

/// Animated cross-fade that respects reduce-motion.
class AppAnimatedCrossFade extends StatelessWidget {
  final Widget firstChild;
  final Widget secondChild;
  final CrossFadeState crossFadeState;
  final bool reduceMotion;

  const AppAnimatedCrossFade({
    super.key,
    required this.firstChild,
    required this.secondChild,
    required this.crossFadeState,
    this.reduceMotion = false,
  });

  @override
  Widget build(BuildContext context) {
    if (reduceMotion) {
      return crossFadeState == CrossFadeState.showFirst
          ? firstChild
          : secondChild;
    }
    return AnimatedCrossFade(
      firstChild: firstChild,
      secondChild: secondChild,
      crossFadeState: crossFadeState,
      duration: AppDurations.normal,
    );
  }
}
