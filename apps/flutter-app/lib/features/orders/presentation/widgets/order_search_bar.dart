import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';

class OrderSearchBar extends StatefulWidget {
  final String initialQuery;
  final ValueChanged<String> onSearch;
  final VoidCallback onClose;
  const OrderSearchBar({super.key, this.initialQuery = '', required this.onSearch, required this.onClose});

  @override
  State<OrderSearchBar> createState() => _OrderSearchBarState();
}

class _OrderSearchBarState extends State<OrderSearchBar> {
  late TextEditingController _controller;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialQuery);
    _controller.addListener(_onChanged);
  }

  void _onChanged() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      widget.onSearch(_controller.text);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return TextField(
      controller: _controller,
      autofocus: true,
      style: GoogleFonts.inter(fontSize: 14),
      decoration: InputDecoration(
        hintText: 'Search orders, customers, items...',
        hintStyle: GoogleFonts.inter(color: cs.onSurfaceVariant.withValues(alpha: 0.5)),
        prefixIcon: Icon(Icons.search, size: 20, color: cs.onSurfaceVariant),
        suffixIcon: IconButton(
          icon: const Icon(Icons.close, size: 18),
          onPressed: () { _controller.clear(); widget.onClose(); },
        ),
        filled: true,
        fillColor: cs.surfaceContainerHighest.withValues(alpha: 0.3),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimens.radiusFull),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimens.radiusFull),
          borderSide: const BorderSide(color: AppColors.primary, width: 1),
        ),
      ),
    );
  }
}
