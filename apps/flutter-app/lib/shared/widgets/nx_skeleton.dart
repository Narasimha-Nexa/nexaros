/// Enterprise skeleton/shimmer loading widget.
library;

import 'package:flutter/material.dart';

class NxSkeleton extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius? borderRadius;
  final Color? baseColor;
  final Color? highlightColor;

  const NxSkeleton({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius,
    this.baseColor,
    this.highlightColor,
  });

  const NxSkeleton.circle({
    super.key,
    required double size,
    this.baseColor,
    this.highlightColor,
  })  : width = size,
        height = size,
        borderRadius = null;

  const NxSkeleton.card({
    super.key,
    this.baseColor,
    this.highlightColor,
  })  : width = double.infinity,
        height = 80,
        borderRadius = null;

  @override
  State<NxSkeleton> createState() => _NxSkeletonState();
}

class _NxSkeletonState extends State<NxSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _animation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final base =
        widget.baseColor ?? (isDark ? Colors.grey[800]! : Colors.grey[200]!);
    final highlight =
        widget.highlightColor ?? (isDark ? Colors.grey[700]! : Colors.grey[100]!);

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            gradient: LinearGradient(
              begin: Alignment(-1.0 + 2.0 * _animation.value, 0),
              end: Alignment(-0.5 + 2.0 * _animation.value, 0),
              colors: [base, highlight, base],
            ),
          ),
        );
      },
    );
  }
}

/// Pre-built skeleton layout for list items.
class NxSkeletonList extends StatelessWidget {
  final int itemCount;
  final double itemHeight;
  final double spacing;

  const NxSkeletonList({
    super.key,
    this.itemCount = 5,
    this.itemHeight = 72,
    this.spacing = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(itemCount, (i) {
        return Padding(
          padding: EdgeInsets.only(bottom: i < itemCount - 1 ? spacing : 0),
          child: const Row(
            children: [
              NxSkeleton.circle(size: 48),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    NxSkeleton(width: 160, height: 14),
                    SizedBox(height: 8),
                    NxSkeleton(width: 240, height: 12),
                  ],
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}

/// Pre-built skeleton layout for grid items.
class NxSkeletonGrid extends StatelessWidget {
  final int itemCount;
  final int crossAxisCount;

  const NxSkeletonGrid({
    super.key,
    this.itemCount = 6,
    this.crossAxisCount = 2,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: crossAxisCount,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 1.5,
      children: List.generate(itemCount, (_) => const NxSkeleton(height: 100)),
    );
  }
}
