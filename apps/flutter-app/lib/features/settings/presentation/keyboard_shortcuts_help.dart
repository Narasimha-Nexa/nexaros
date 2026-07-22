import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/providers/keyboard_shortcuts_provider.dart';

class KeyboardShortcutsHelp extends ConsumerWidget {
  const KeyboardShortcutsHelp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final registry = ref.watch(keyboardShortcutsProvider);

    if (!registry.showHelp) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () => registry.closeHelp(),
      child: Container(
        color: Colors.black54,
        child: Center(
          child: GestureDetector(
            onTap: () {}, // Prevent close when tapping the dialog
            child: Material(
              borderRadius: BorderRadius.circular(16),
              color: AppColors.white,
              elevation: 8,
              child: Container(
                width: 600,
                constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.keyboard, color: AppColors.primary),
                        const SizedBox(width: 10),
                        Text('Keyboard Shortcuts', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold)),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => registry.closeHelp(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('Press Ctrl+K to open the command palette', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView(
                        children: registry.grouped.entries.map((entry) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(entry.key.toUpperCase(), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.gray400, letterSpacing: 0.5)),
                              const SizedBox(height: 8),
                              ...entry.value.map((shortcut) => _buildShortcutRow(shortcut)),
                              const SizedBox(height: 16),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildShortcutRow(KeyboardShortcut shortcut) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(shortcut.label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                Text(shortcut.description, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.gray100,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: AppColors.gray200),
            ),
            child: Text(shortcut.display, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.gray700)),
          ),
        ],
      ),
    );
  }
}
