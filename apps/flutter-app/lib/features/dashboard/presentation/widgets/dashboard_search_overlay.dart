import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_dimens.dart';
import '../../data/dashboard_models.dart';

class DashboardSearchResult {
  final String id;
  final String title;
  final String subtitle;
  final String category;
  final IconData icon;
  final VoidCallback? onTap;
  const DashboardSearchResult({required this.id, required this.title, required this.subtitle, required this.category, required this.icon, this.onTap});
}

class DashboardSearchOverlay extends StatefulWidget {
  final DashboardData data;
  const DashboardSearchOverlay({super.key, required this.data});

  static Future<void> show(BuildContext context, DashboardData data) {
    return showGeneralDialog(
      context: context, barrierDismissible: true, barrierLabel: 'Search',
      barrierColor: Colors.black54, transitionDuration: const Duration(milliseconds: 200),
      pageBuilder: (_, __, ___) => DashboardSearchOverlay(data: data),
      transitionBuilder: (_, anim, __, child) => FadeTransition(
        opacity: anim, child: ScaleTransition(scale: CurvedAnimation(parent: anim, curve: Curves.easeOut), child: child)),
    );
  }

  @override
  State<DashboardSearchOverlay> createState() => _DashboardSearchOverlayState();
}

class _DashboardSearchOverlayState extends State<DashboardSearchOverlay> {
  final _controller = TextEditingController();
  final _focusNode = FocusNode();
  List<DashboardSearchResult> _results = [];
  bool _hasSearched = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focusNode.requestFocus());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 200), () {
      if (!mounted) return;
      setState(() { _results = _search(query); _hasSearched = query.isNotEmpty; });
    });
  }

  List<DashboardSearchResult> _search(String query) {
    if (query.isEmpty) return [];
    final q = query.toLowerCase();
    final results = <DashboardSearchResult>[];
    for (final kpi in widget.data.kpis) {
      if (kpi.label.toLowerCase().contains(q) || kpi.value.toLowerCase().contains(q)) {
        results.add(DashboardSearchResult(id: 'kpi_${kpi.id}', title: kpi.label, subtitle: kpi.value, category: 'KPI', icon: Icons.analytics));
      }
    }
    for (final item in widget.data.topSelling) {
      if (item.name.toLowerCase().contains(q)) {
        results.add(DashboardSearchResult(id: 'item_${item.name}', title: item.name, subtitle: '${item.quantity} sold', category: 'Menu Item', icon: Icons.restaurant_menu));
      }
    }
    for (final cat in widget.data.categorySales) {
      if (cat.category.toLowerCase().contains(q)) {
        results.add(DashboardSearchResult(id: 'cat_${cat.category}', title: cat.category, subtitle: '${cat.percentage.toStringAsFixed(0)}%', category: 'Category', icon: Icons.category));
      }
    }
    for (final n in widget.data.notifications) {
      if (n.title.toLowerCase().contains(q) || n.message.toLowerCase().contains(q)) {
        results.add(DashboardSearchResult(id: 'notif_${n.id}', title: n.title, subtitle: n.message, category: 'Notification', icon: Icons.notifications));
      }
    }
    if (widget.data.header != null) {
      final h = widget.data.header!;
      if (h.restaurantName.toLowerCase().contains(q) || h.branchName.toLowerCase().contains(q)) {
        results.add(DashboardSearchResult(id: 'restaurant', title: h.restaurantName, subtitle: h.branchName, category: 'Restaurant', icon: Icons.store));
      }
    }
    for (final insight in widget.data.aiInsights) {
      if (insight.title.toLowerCase().contains(q) || insight.description.toLowerCase().contains(q)) {
        results.add(DashboardSearchResult(id: 'insight_${insight.id}', title: insight.title, subtitle: insight.description, category: 'AI Insight', icon: Icons.auto_awesome));
      }
    }
    return results;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Material(
      color: Colors.transparent,
      child: Center(child: Container(
        width: 600, constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.7),
        margin: EdgeInsets.symmetric(horizontal: AppDimens.lg),
        decoration: BoxDecoration(color: cs.surface, borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 24, offset: const Offset(0, 8))]),
        child: Material(
          color: Colors.transparent,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Padding(padding: EdgeInsets.all(AppDimens.base),
              child: TextField(controller: _controller, focusNode: _focusNode, onChanged: _onSearch,
                decoration: InputDecoration(hintText: 'Search dashboard...', hintStyle: GoogleFonts.inter(color: cs.onSurfaceVariant),
                  prefixIcon: Icon(Icons.search, color: cs.onSurfaceVariant),
                  suffixIcon: _controller.text.isNotEmpty
                    ? IconButton(icon: const Icon(Icons.clear), onPressed: () { _controller.clear(); _onSearch(''); }) : null,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true, fillColor: cs.surfaceContainerHighest.withValues(alpha: 0.3)),
                style: GoogleFonts.inter(fontSize: 15))),
            if (!_hasSearched)
              Padding(padding: EdgeInsets.all(AppDimens.xl),
                child: Column(children: [
                  Icon(Icons.search, size: 48, color: cs.onSurfaceVariant.withValues(alpha: 0.3)),
                  SizedBox(height: AppDimens.sm),
                  Text('Search KPIs, items, categories...', style: GoogleFonts.inter(fontSize: 13, color: cs.onSurfaceVariant.withValues(alpha: 0.6)), textAlign: TextAlign.center),
                ]))
            else if (_results.isEmpty)
              Padding(padding: EdgeInsets.all(AppDimens.xl),
                child: Column(children: [
                  Icon(Icons.search_off, size: 48, color: cs.onSurfaceVariant.withValues(alpha: 0.3)),
                  SizedBox(height: AppDimens.sm),
                  Text('No results found', style: GoogleFonts.inter(fontSize: 14, color: cs.onSurfaceVariant)),
                ]))
            else
              Flexible(child: ListView.builder(shrinkWrap: true, itemCount: _results.length,
                itemBuilder: (context, index) {
                  final r = _results[index];
                  return ListTile(
                    leading: Container(width: 36, height: 36, decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                      child: Icon(r.icon, size: 18, color: AppColors.primary)),
                    title: Text(r.title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text(r.subtitle, style: GoogleFonts.inter(fontSize: 12, color: cs.onSurfaceVariant), maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: Container(padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(4)),
                      child: Text(r.category, style: GoogleFonts.inter(fontSize: 10, color: cs.onSurfaceVariant))),
                    onTap: r.onTap ?? () => Navigator.pop(context));
                })),
          ]),
        ),
      )),
    );
  }
}

class DashboardSearchShortcut extends StatelessWidget {
  final DashboardData data;
  final Widget child;
  const DashboardSearchShortcut({super.key, required this.data, required this.child});

  @override
  Widget build(BuildContext context) {
    return Shortcuts(
      shortcuts: {
        LogicalKeySet(LogicalKeyboardKey.control, LogicalKeyboardKey.keyK): const _SearchIntent(),
        LogicalKeySet(LogicalKeyboardKey.meta, LogicalKeyboardKey.keyK): const _SearchIntent(),
      },
      child: Actions(actions: {
        _SearchIntent: CallbackAction<_SearchIntent>(onInvoke: (_) { DashboardSearchOverlay.show(context, data); return null; }),
      }, child: child),
    );
  }
}

class _SearchIntent extends Intent { const _SearchIntent(); }
