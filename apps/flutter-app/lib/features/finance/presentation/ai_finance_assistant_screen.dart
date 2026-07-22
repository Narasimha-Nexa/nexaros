import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/finance_models.dart';
import '../data/finance_service.dart';

class AiFinanceAssistantScreen extends ConsumerStatefulWidget {
  const AiFinanceAssistantScreen({super.key});
  @override
  ConsumerState<AiFinanceAssistantScreen> createState() => _AiFinanceAssistantScreenState();
}

class _AiFinanceAssistantScreenState extends ConsumerState<AiFinanceAssistantScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(title: const Text('AI Finance Assistant')),
      body: Column(
        children: [
          _buildTabBar(),
          Expanded(child: _buildTabContent()),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    final tabs = ['Insights', 'Predictions', 'Risk Analysis', 'Optimization'];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Row(
        children: tabs.asMap().entries.map((entry) => Padding(
          padding: const EdgeInsets.only(right: 8),
          child: ChoiceChip(
            label: Text(entry.value, style: TextStyle(fontSize: 12, color: _selectedTab == entry.key ? Colors.white : AppColors.gray700)),
            selected: _selectedTab == entry.key,
            onSelected: (_) => setState(() => _selectedTab = entry.key),
            selectedColor: AppColors.primary,
            backgroundColor: AppColors.gray100,
          ),
        )).toList(),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_selectedTab) {
      case 0: return _buildInsightsTab();
      case 1: return _buildPredictionsTab();
      case 2: return _buildRiskTab();
      case 3: return _buildOptimizationTab();
      default: return _buildInsightsTab();
    }
  }

  Widget _buildInsightsTab() {
    final insights = [
      FinanceInsight('Revenue Trend', 'Revenue increased 12% month-over-month. Dine-in leads at 58% of total revenue.', Icons.trending_up, AppColors.success, 'Positive'),
      FinanceInsight('Expense Alert', 'Food cost percentage rose to 38% (target: 32%). Review supplier pricing and menu costs.', Icons.warning, AppColors.warning, 'Warning'),
      FinanceInsight('Cash Flow Health', 'Cash flow positive for 6 consecutive months. Strong financial position.', Icons.account_balance, AppColors.primary, 'Info'),
      FinanceInsight('Payment Mix', 'UPI transactions now represent 45% of payments. Consider optimizing UPI settlement terms.', Icons.payment, AppColors.info, 'Insight'),
      FinanceInsight('Profitability', 'Lunch service generates 62% of daily profit. Consider expanding lunch menu offerings.', Icons.restaurant, AppColors.success, 'Opportunity'),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: insights.length,
      itemBuilder: (context, i) {
        final insight = insights[i];
        return NxCard(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: insight.color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                  child: Icon(insight.icon, color: insight.color, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Text(insight.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: insight.color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                          child: Text(insight.severity, style: TextStyle(fontSize: 10, color: insight.color, fontWeight: FontWeight.w600)),
                        ),
                      ]),
                      const SizedBox(height: 4),
                      Text(insight.description, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPredictionsTab() {
    final predictions = [
      FinanceForecastItem('Next Month Revenue', 'Based on current trajectory and seasonal patterns', '₹11.8L', AppColors.success),
      FinanceForecastItem('Expense Projection', 'Operating costs expected to increase with inflation', '₹7.9L', AppColors.warning),
      FinanceForecastItem('Profit Forecast', 'Net profit margin stable at 17-19% range', '₹2.1L', AppColors.primary),
      FinanceForecastItem('Cash Requirement', 'Sufficient reserves for 3 months of operations', '₹4.2L', AppColors.info),
      FinanceForecastItem('Tax Liability', 'Estimated GST liability for current quarter', '₹1.4L', AppColors.secondary),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: predictions.length,
      itemBuilder: (context, i) {
        final p = predictions[i];
        return NxCard(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: p.color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.auto_graph, color: p.color),
            ),
            title: Text(p.title, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(p.description, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
            trailing: Text(p.value, style: TextStyle(fontWeight: FontWeight.bold, color: p.color, fontSize: 16)),
          ),
        );
      },
    );
  }

  Widget _buildRiskTab() {
    final risks = [
      _RiskItem('Food Cost Creep', 'Food cost rising above 35% threshold. Negotiate with suppliers or adjust menu pricing.', 72, AppColors.warning),
      _RiskItem('Cash Flow Seasonality', 'Historical data shows 15% revenue dip in monsoon season. Prepare cash reserves.', 58, AppColors.info),
      _RiskItem('Tax Compliance', 'All GST filings are current. No compliance risk detected.', 15, AppColors.success),
      _RiskItem('Settlement Delays', 'Average settlement time increased from T+1 to T+2. Monitor payment provider performance.', 45, AppColors.warning),
      _RiskItem('Expense Anomaly', 'Utility bills 22% higher than expected. Investigate for leaks or billing errors.', 65, AppColors.danger),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: risks.length,
      itemBuilder: (context, i) {
        final r = risks[i];
        return NxCard(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(r.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const Spacer(),
                  Text('Risk: ${r.score}%', style: TextStyle(fontSize: 12, color: r.color, fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 6),
                Text(r.description, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: r.score / 100,
                  backgroundColor: AppColors.gray200,
                  color: r.color,
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(3),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildOptimizationTab() {
    final optimizations = [
      _OptItem('Menu Price Optimization', 'Increase prices on high-demand items by 5% to improve margin by 2.3%.', 'Save ₹45K/month', AppColors.success, 0.85),
      _OptItem('Supplier Consolidation', 'Consolidate 3 vegetable suppliers to 1 for better bulk pricing.', 'Save ₹18K/month', AppColors.info, 0.72),
      _OptItem('Payment Method Routing', 'Route more transactions through UPI to reduce processing fees.', 'Save ₹8K/month', AppColors.primary, 0.68),
      _OptItem('Inventory Waste Reduction', 'Implement FIFO more strictly to reduce food waste by 15%.', 'Save ₹25K/month', AppColors.warning, 0.78),
      _OptItem('Staff Scheduling', 'Optimize shift overlap to reduce overtime by 20%.', 'Save ₹12K/month', AppColors.secondary, 0.65),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: optimizations.length,
      itemBuilder: (context, i) {
        final o = optimizations[i];
        return NxCard(
          margin: const EdgeInsets.only(bottom: 8),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(o.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  const Spacer(),
                  Text(o.impact, style: TextStyle(fontSize: 12, color: o.color, fontWeight: FontWeight.w600)),
                ]),
                const SizedBox(height: 6),
                Text(o.description, style: const TextStyle(fontSize: 12, color: AppColors.gray600)),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: o.score,
                  backgroundColor: AppColors.gray200,
                  color: o.color,
                  minHeight: 6,
                  borderRadius: BorderRadius.circular(3),
                ),
                const SizedBox(height: 4),
                Text('Confidence: ${(o.score * 100).toStringAsFixed(0)}%', style: const TextStyle(fontSize: 10, color: AppColors.gray500)),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _RiskItem {
  final String title, description;
  final int score;
  final Color color;
  const _RiskItem(this.title, this.description, this.score, this.color);
}

class _OptItem {
  final String title, description, impact;
  final Color color;
  final double score;
  const _OptItem(this.title, this.description, this.impact, this.color, this.score);
}
