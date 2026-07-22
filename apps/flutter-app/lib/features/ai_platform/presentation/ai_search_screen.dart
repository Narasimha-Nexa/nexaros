import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';

class AiSearchScreen extends StatefulWidget {
  const AiSearchScreen({super.key});

  @override
  State<AiSearchScreen> createState() => _AiSearchScreenState();
}

class _AiSearchScreenState extends State<AiSearchScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  List<_SearchResult> _results = [];
  bool _isSearching = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) return;
    setState(() { _query = query; _isSearching = true; });
    await Future.delayed(const Duration(milliseconds: 800));
    setState(() {
      _results = [
        _SearchResult(id: '1', type: 'orders', title: 'Order #ORD-2024-001', snippet: 'Customer ordered Biryani, Butter Chicken, Naan. Total: ₹850. Status: Delivered.', score: 0.95, icon: Icons.receipt_long, route: '/shell/orders'),
        _SearchResult(id: '2', type: 'customers', title: 'Rahul Sharma', snippet: 'Regular customer. 15 orders this month. Loyalty tier: Gold. Last visit: 2 days ago.', score: 0.92, icon: Icons.person, route: '/shell/crm'),
        _SearchResult(id: '3', type: 'inventory', title: 'Basmati Rice (25kg)', snippet: 'Current stock: 5 units. Min: 10. Reorder needed. Last purchased from: Krishna Traders.', score: 0.88, icon: Icons.inventory_2, route: '/shell/inventory'),
        _SearchResult(id: '4', type: 'finance', title: 'Monthly Revenue Report', snippet: 'Total revenue: ₹8,45,000. Growth: +12% MoM. Top category: Biryani (35% of revenue).', score: 0.85, icon: Icons.account_balance, route: '/shell/reports'),
        _SearchResult(id: '5', type: 'staff', title: 'Priya (Chef)', snippet: 'Performance rating: 4.5/5. Dishes prepared today: 42. Avg prep time: 12 min.', score: 0.82, icon: Icons.kitchen, route: '/shell/staff'),
        _SearchResult(id: '6', type: 'recipes', title: 'Chicken Biryani Recipe', snippet: 'Ingredients: Basmati rice 500g, Chicken 750g, Yogurt 200ml, Saffron, Garam masala. Prep: 30 min.', score: 0.78, icon: Icons.restaurant_menu, route: null),
        _SearchResult(id: '7', type: 'invoices', title: 'Invoice #INV-2024-156', snippet: 'Amount: ₹2,450. Paid via UPI. Customer: Meera Patel. Date: 15 Jan 2024.', score: 0.75, icon: Icons.description, route: null),
      ];
      _isSearching = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('AI Search', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              autofocus: true,
              style: GoogleFonts.inter(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search orders, customers, inventory, finance...',
                hintStyle: GoogleFonts.inter(color: AppColors.gray400),
                prefixIcon: Icon(Icons.search, color: AppColors.gray400),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
              textInputAction: TextInputAction.search,
              onSubmitted: _performSearch,
              onChanged: (v) {
                if (v.length > 3) _performSearch(v);
              },
            ),
          ),
          Expanded(
            child: _isSearching
                ? const Center(child: NxFullScreenLoader())
                : _query.isEmpty
                    ? _buildSearchSuggestions()
                    : _results.isEmpty
                        ? const NxEmptyState(icon: Icons.search_off, title: 'No results found')
                        : _buildResults(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchSuggestions() {
    final suggestions = [
      _SearchSuggestion('Show me today\'s orders', Icons.receipt_long),
      _SearchSuggestion('Low stock items', Icons.warning_amber),
      _SearchSuggestion('Revenue this week', Icons.trending_up),
      _SearchSuggestion('Staff performance', Icons.people),
      _SearchSuggestion('Pending payments', Icons.payment),
      _SearchSuggestion('Customer feedback', Icons.star),
    ];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Try searching for', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.gray600)),
          const SizedBox(height: 12),
          ...suggestions.map((s) => ListTile(
            dense: true,
            leading: Icon(s.icon, size: 18, color: AppColors.gray500),
            title: Text(s.text, style: GoogleFonts.inter(fontSize: 13)),
            trailing: Icon(Icons.north_west, size: 14, color: AppColors.gray400),
            onTap: () {
              _searchController.text = s.text;
              _performSearch(s.text);
            },
          )),
        ],
      ),
    );
  }

  Widget _buildResults() {
    final grouped = <String, List<_SearchResult>>{};
    for (final r in _results) {
      grouped.putIfAbsent(r.type, () => []).add(r);
    }

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        Text('${_results.length} results for "$_query"', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray500)),
        const SizedBox(height: 12),
        ...grouped.entries.map((entry) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(entry.key.toUpperCase(), style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.gray400, letterSpacing: 0.5)),
            const SizedBox(height: 8),
            ...entry.value.map((r) => _buildResultCard(r)),
            const SizedBox(height: 16),
          ],
        )),
      ],
    );
  }

  Widget _buildResultCard(_SearchResult result) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
          child: Icon(result.icon, color: AppColors.primary, size: 18),
        ),
        title: Text(result.title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
        subtitle: Text(result.snippet, style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray600), maxLines: 2, overflow: TextOverflow.ellipsis),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
              child: Text('${(result.score * 100).round()}%', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.success)),
            ),
            if (result.route != null) ...[
              const SizedBox(width: 4),
              Icon(Icons.chevron_right, size: 16, color: AppColors.gray400),
            ],
          ],
        ),
      ),
    );
  }
}

class _SearchResult {
  final String id;
  final String type;
  final String title;
  final String snippet;
  final double score;
  final IconData icon;
  final String? route;

  const _SearchResult({required this.id, required this.type, required this.title, required this.snippet, required this.score, required this.icon, this.route});
}

class _SearchSuggestion {
  final String text;
  final IconData icon;
  const _SearchSuggestion(this.text, this.icon);
}
