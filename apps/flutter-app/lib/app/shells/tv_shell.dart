import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../features/kitchen/presentation/kitchen_display_screen.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';

/// TV-optimized shell for kitchen display and large screen viewing.
/// Features large text, high contrast, and minimal navigation.
class TVShell extends StatefulWidget {
  const TVShell({super.key});

  @override
  State<TVShell> createState() => _TVShellState();
}

class _TVShellState extends State<TVShell> {
  int _currentIndex = 0;

  // TV-optimized screens with large, glanceable content
  final _pages = const [
    KitchenDisplayScreen(),
    DashboardScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Minimal header bar for TV
          Container(
            height: 48,
            color: AppColors.gray900,
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              children: [
                Icon(Icons.restaurant, color: AppColors.primary, size: 24),
                const SizedBox(width: 8),
                Text('NexaROS TV', style: GoogleFonts.inter(
                  fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white,
                )),
                const Spacer(),
                _TVNavButton(
                  label: 'Kitchen',
                  icon: Icons.precision_manufacturing,
                  isSelected: _currentIndex == 0,
                  onTap: () => setState(() => _currentIndex = 0),
                ),
                const SizedBox(width: 16),
                _TVNavButton(
                  label: 'Dashboard',
                  icon: Icons.dashboard,
                  isSelected: _currentIndex == 1,
                  onTap: () => setState(() => _currentIndex = 1),
                ),
                const SizedBox(width: 16),
                Text(
                  DateTime.now().toString().substring(0, 16),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 14, color: AppColors.gray400),
                ),
              ],
            ),
          ),
          // Content
          Expanded(child: _pages[_currentIndex]),
        ],
      ),
    );
  }
}

class _TVNavButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _TVNavButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text(label, style: GoogleFonts.inter(
              fontSize: 14, fontWeight: FontWeight.w500, color: Colors.white,
            )),
          ],
        ),
      ),
    );
  }
}
