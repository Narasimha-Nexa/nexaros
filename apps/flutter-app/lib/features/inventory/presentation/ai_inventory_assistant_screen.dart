import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/inventory_models.dart';

class AiInventoryAssistantScreen extends ConsumerStatefulWidget {
  const AiInventoryAssistantScreen({super.key});

  @override
  ConsumerState<AiInventoryAssistantScreen> createState() =>
      _AiInventoryAssistantScreenState();
}

class _AiInventoryAssistantScreenState
    extends ConsumerState<AiInventoryAssistantScreen> {
  late final dynamic _api;
  List<InventoryInsight> _insights = [];
  List<PurchaseSuggestion> _suggestions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait<dynamic>([
        _api.getInsights().catchError((_) => <dynamic>[]),
        _api.getInventoryItems(),
      ]);
      if (mounted) {
        final insights = results[0] as List<dynamic>;
        final items = (results[1] as List<dynamic>)
            .map((j) => InventoryItem.fromJson(j as Map<String, dynamic>))
            .toList();

        final suggestions = <PurchaseSuggestion>[];
        for (final item in items) {
          if (item.needsReorder || item.isLowStock || item.isOutOfStock) {
            final urgency = item.isOutOfStock
                ? 'critical'
                : item.isLowStock
                    ? 'high'
                    : 'medium';
            final suggestedQty = item.reorderQuantity > 0
                ? item.reorderQuantity
                : item.minimumStock * 2;
            suggestions.add(PurchaseSuggestion(
              itemId: item.id,
              itemName: item.name,
              currentStock: item.currentStock,
              reorderLevel: item.reorderLevel,
              suggestedQuantity: suggestedQty,
              estimatedCost: suggestedQty * item.costPrice,
              supplierName: item.supplierName,
              urgency: urgency,
            ));
          }
        }
        suggestions.sort((a, b) {
          final order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3};
          return (order[a.urgency] ?? 3).compareTo(order[b.urgency] ?? 3);
        });

        setState(() {
          _insights = insights
              .map((j) => InventoryInsight(
                    title: (j as Map<String, dynamic>)['title'] ?? '',
                    description: j['description'] ?? '',
                    type: j['type'] ?? 'info',
                    action: j['action'],
                    itemId: j['itemId'],
                  ))
              .toList();
          _suggestions = suggestions;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final criticalCount =
        _suggestions.where((s) => s.urgency == 'critical').length;
    final highCount = _suggestions.where((s) => s.urgency == 'high').length;
    final mediumCount =
        _suggestions.where((s) => s.urgency == 'medium').length;

    return Scaffold(
      appBar: AppBar(
        title: Text('AI Assistant', style: AppTextStyles.h2),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withValues(alpha: 0.08),
                          AppColors.secondary.withValues(alpha: 0.06),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.auto_awesome,
                            size: 24,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Inventory Intelligence',
                                style: AppTextStyles.h3,
                              ),
                              Text(
                                '${_insights.length} insights • ${_suggestions.length} suggestions',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.gray500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      _urgencyCard(
                          'Critical', criticalCount, AppColors.danger),
                      const SizedBox(width: 8),
                      _urgencyCard('High', highCount, AppColors.warning),
                      const SizedBox(width: 8),
                      _urgencyCard(
                          'Medium', mediumCount, AppColors.primary),
                    ],
                  ),
                  if (_insights.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text('AI Insights', style: AppTextStyles.h3),
                    const SizedBox(height: 8),
                    ..._insights.map((insight) => _buildInsightCard(insight)),
                  ],
                  if (_suggestions.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Text('Purchase Suggestions', style: AppTextStyles.h3),
                    const SizedBox(height: 4),
                    Text(
                      'Based on current stock levels and reorder points',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.gray500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._suggestions
                        .take(10)
                        .map((s) => _buildSuggestionCard(s)),
                  ],
                  if (_insights.isEmpty && _suggestions.isEmpty)
                    NxEmptyState(
                      icon: Icons.auto_awesome,
                      title: 'No insights available',
                      subtitle:
                          'AI will analyze your inventory data and provide recommendations',
                    ),
                ],
              ),
            ),
    );
  }

  Widget _urgencyCard(String label, int count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Column(
          children: [
            Text(
              '$count',
              style: AppTextStyles.statValue.copyWith(
                fontSize: 20,
                color: color,
              ),
            ),
            Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: color,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightCard(InventoryInsight insight) {
    final typeColor = insight.type == 'critical'
        ? AppColors.danger
        : insight.type == 'warning'
            ? AppColors.warning
            : AppColors.info;
    final typeIcon = insight.type == 'critical'
        ? Icons.error
        : insight.type == 'warning'
            ? Icons.warning
            : Icons.info;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: typeColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(typeIcon, size: 20, color: typeColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(insight.title, style: AppTextStyles.labelLarge),
                const SizedBox(height: 2),
                Text(
                  insight.description,
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.gray500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestionCard(PurchaseSuggestion suggestion) {
    final urgencyColor = suggestion.urgency == 'critical'
        ? AppColors.danger
        : suggestion.urgency == 'high'
            ? AppColors.warning
            : AppColors.primary;

    return NxCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(suggestion.itemName, style: AppTextStyles.h4),
                    Text(
                      'Stock: ${suggestion.currentStock.toStringAsFixed(1)} • Reorder at: ${suggestion.reorderLevel.toStringAsFixed(1)}',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.gray500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: urgencyColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  suggestion.urgency.toUpperCase(),
                  style: AppTextStyles.labelSmall.copyWith(
                    color: urgencyColor,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.gray50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                _suggestionDetail(
                  'Order Qty',
                  '${suggestion.suggestedQuantity.toStringAsFixed(0)}',
                  Icons.shopping_cart,
                ),
                const SizedBox(width: 16),
                _suggestionDetail(
                  'Est. Cost',
                  '₹${suggestion.estimatedCost.toStringAsFixed(0)}',
                  Icons.currency_rupee,
                ),
                const SizedBox(width: 16),
                _suggestionDetail(
                  'Supplier',
                  suggestion.supplierName ?? 'N/A',
                  Icons.business,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _suggestionDetail(String label, String value, IconData icon) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.gray400),
          const SizedBox(width: 4),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: AppTextStyles.labelSmall,
              ),
              Text(
                label,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.gray400,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
