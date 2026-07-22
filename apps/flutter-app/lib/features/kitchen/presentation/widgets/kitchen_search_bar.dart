import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/riverpod_providers.dart';

class KitchenSearchBar extends ConsumerStatefulWidget {
  final bool darkMode;
  const KitchenSearchBar({super.key, this.darkMode = false});

  @override
  ConsumerState<KitchenSearchBar> createState() => _KitchenSearchBarState();
}

class _KitchenSearchBarState extends ConsumerState<KitchenSearchBar> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return TextField(
      controller: _controller,
      focusNode: _focusNode,
      style: GoogleFonts.inter(color: widget.darkMode ? Colors.white : cs.onSurface),
      decoration: InputDecoration(
        hintText: 'Search orders, tables, items, chefs...',
        hintStyle: GoogleFonts.inter(color: widget.darkMode ? Colors.white38 : AppColors.gray400),
        prefixIcon: Icon(Icons.search, size: 20, color: widget.darkMode ? Colors.white38 : AppColors.gray400),
        suffixIcon: _controller.text.isNotEmpty
            ? IconButton(
                icon: Icon(Icons.clear, size: 18, color: widget.darkMode ? Colors.white38 : AppColors.gray400),
                onPressed: () {
                  _controller.clear();
                  ref.read(kitchenProvider).setSearchQuery('');
                  setState(() {});
                },
              )
            : null,
        filled: true,
        fillColor: widget.darkMode ? Colors.white10 : cs.surfaceContainerHighest.withValues(alpha: 0.3),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        isDense: true,
      ),
      onChanged: (value) {
        ref.read(kitchenProvider).setSearchQuery(value);
        setState(() {});
      },
      onSubmitted: (value) {
        ref.read(kitchenProvider).setSearchQuery(value);
      },
    );
  }
}
