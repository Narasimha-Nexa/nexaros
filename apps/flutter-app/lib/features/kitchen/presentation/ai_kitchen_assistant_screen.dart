import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/kitchen_models.dart';

class AiKitchenAssistantScreen extends ConsumerStatefulWidget {
  const AiKitchenAssistantScreen({super.key});

  @override
  ConsumerState<AiKitchenAssistantScreen> createState() => _AiKitchenAssistantScreenState();
}

class _AiKitchenAssistantScreenState extends ConsumerState<AiKitchenAssistantScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final kitchen = ref.watch(kitchenProvider);
    final orders = kitchen.state.orders;
    final metrics = kitchen.state.metrics;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.psychology, color: Colors.purple),
            const SizedBox(width: 8),
            Text('AI Kitchen Assistant', style: AppTextStyles.h2),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.speed), text: 'Predictions'),
            Tab(icon: Icon(Icons.warning_amber), text: 'Bottlenecks'),
            Tab(icon: Icon(Icons.balance), text: 'Load Balance'),
            Tab(icon: Icon(Icons.analytics), text: 'Forecast'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPredictionsTab(orders, metrics),
          _buildBottlenecksTab(orders, metrics),
          _buildLoadBalanceTab(orders, metrics),
          _buildForecastTab(orders, metrics),
        ],
      ),
    );
  }

  Widget _buildPredictionsTab(List<KitchenOrder> orders, KitchenMetrics metrics) {
    final active = orders.where((o) => o.status.isActive).toList();
    final predictions = _generateTimePredictions(active);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInsightHeader(
          'Time Predictions',
          'AI estimates completion times based on current kitchen load',
          Icons.timer,
          Colors.blue,
        ),
        const SizedBox(height: 16),
        if (predictions.isEmpty)
          NxEmptyState(
            icon: Icons.timer_off,
            title: 'No active orders',
            subtitle: 'Predictions will appear when orders are in progress',
          )
        else
          ...predictions.map((p) => _buildPredictionCard(p)),
      ],
    );
  }

  Widget _buildBottlenecksTab(List<KitchenOrder> orders, KitchenMetrics metrics) {
    final bottlenecks = _detectBottlenecks(orders, metrics);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInsightHeader(
          'Bottleneck Detection',
          'Real-time analysis of kitchen workflow congestion',
          Icons.warning_amber,
          Colors.orange,
        ),
        const SizedBox(height: 16),
        if (bottlenecks.isEmpty)
          const NxEmptyState(
            icon: Icons.check_circle_outline,
            title: 'No bottlenecks detected',
            subtitle: 'Kitchen is running smoothly',
          )
        else
          ...bottlenecks.map((b) => _buildBottleneckCard(b)),
      ],
    );
  }

  Widget _buildLoadBalanceTab(List<KitchenOrder> orders, KitchenMetrics metrics) {
    final assignments = _generateLoadBalance(orders);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInsightHeader(
          'Load Balancing',
          'Optimal chef-to-station assignments',
          Icons.balance,
          Colors.green,
        ),
        const SizedBox(height: 16),
        ...assignments.map((a) => _buildLoadBalanceCard(a)),
      ],
    );
  }

  Widget _buildForecastTab(List<KitchenOrder> orders, KitchenMetrics metrics) {
    final forecast = _generateForecast(orders, metrics);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInsightHeader(
          'Rush Forecast',
          'Predicted busy periods based on order patterns',
          Icons.trending_up,
          Colors.purple,
        ),
        const SizedBox(height: 16),
        ...forecast.map((f) => _buildForecastCard(f)),
      ],
    );
  }

  Widget _buildInsightHeader(String title, String subtitle, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withAlpha(30), color.withAlpha(10)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(50)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(subtitle, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPredictionCard(TimePrediction prediction) {
    final statusColor = prediction.confidence > 0.8 ? Colors.green : Colors.orange;
    return NxCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 48,
            decoration: BoxDecoration(
              color: statusColor,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  prediction.orderDisplay,
                  style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  prediction.tableName,
                  style: AppTextStyles.bodySmall,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${prediction.estimatedMinutes} min',
                style: AppTextStyles.h3.copyWith(
                  fontWeight: FontWeight.bold,
                  color: statusColor,
                ),
              ),
              Text(
                '${(prediction.confidence * 100).toInt()}% confidence',
                style: AppTextStyles.labelSmall,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottleneckCard(BottleneckInfo bottleneck) {
    final severityColor = bottleneck.severity == 'high'
        ? Colors.red
        : bottleneck.severity == 'medium'
            ? Colors.orange
            : Colors.amber;

    return NxCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                bottleneck.severity == 'high' ? Icons.error : Icons.warning,
                color: severityColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  bottleneck.title,
                  style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.bold),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: severityColor.withAlpha(30),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  bottleneck.severity.toUpperCase(),
                  style: AppTextStyles.labelSmall.copyWith(color: severityColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(bottleneck.description, style: AppTextStyles.bodySmall),
          const SizedBox(height: 8),
          Text(
            'Suggestion: ${bottleneck.suggestion}',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.primary,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadBalanceCard(LoadBalanceSuggestion suggestion) {
    return NxCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: Colors.green.withAlpha(30),
            child: Text(
              suggestion.chefName[0],
              style: AppTextStyles.h4.copyWith(color: Colors.green),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  suggestion.chefName,
                  style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  suggestion.reason,
                  style: AppTextStyles.bodySmall,
                ),
              ],
            ),
          ),
          Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey.shade400),
        ],
      ),
    );
  }

  Widget _buildForecastCard(ForecastEntry entry) {
    return NxCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: entry.level == 'high' ? Colors.red.withAlpha(30) : Colors.blue.withAlpha(30),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              entry.level == 'high' ? Icons.trending_up : Icons.trending_flat,
              color: entry.level == 'high' ? Colors.red : Colors.blue,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.timeRange, style: AppTextStyles.h4.copyWith(fontWeight: FontWeight.bold)),
                Text(entry.description, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          Text(
            '${entry.expectedOrders} orders',
            style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  List<TimePrediction> _generateTimePredictions(List<KitchenOrder> activeOrders) {
    final predictions = <TimePrediction>[];
    for (final order in activeOrders) {
      final avgItemTime = 8.0;
      final baseTime = order.items.length * avgItemTime;
      final rushMultiplier = order.isRush ? 0.7 : 1.0;
      final loadMultiplier = 1.0 + (activeOrders.length / 20);
      final estimated = (baseTime * rushMultiplier * loadMultiplier).round();
      final confidence = order.items.isEmpty ? 0.5 : 0.7 + (0.3 * (1 - order.completionPercentage));

      predictions.add(TimePrediction(
        orderId: order.id,
        orderDisplay: order.displayOrderNumber,
        tableName: order.displayTable.isNotEmpty ? order.displayTable : 'Takeaway',
        estimatedMinutes: estimated,
        confidence: confidence.clamp(0.0, 1.0),
      ));
    }
    return predictions;
  }

  List<BottleneckInfo> _detectBottlenecks(List<KitchenOrder> orders, KitchenMetrics metrics) {
    final bottlenecks = <BottleneckInfo>[];

    final active = orders.where((o) => o.status.isActive).toList();
    final delayed = orders.where((o) => o.isDelayed).toList();
    final held = orders.where((o) => o.status == KitchenOrderStatus.held).toList();

    if (delayed.length > 3) {
      bottlenecks.add(BottleneckInfo(
        title: 'High Delay Rate',
        description: '${delayed.length} orders are delayed. Average delay: ${_calculateAvgDelay(delayed)} minutes.',
        severity: 'high',
        suggestion: 'Consider assigning additional chefs or redistributing orders.',
      ));
    }

    if (held.length > 2) {
      bottlenecks.add(BottleneckInfo(
        title: 'Multiple Held Orders',
        description: '${held.length} orders are on hold, potentially blocking workflow.',
        severity: 'medium',
        suggestion: 'Review held orders and determine if they can be resumed or cancelled.',
      ));
    }

    final stationLoads = <String, int>{};
    for (final order in active) {
      for (final item in order.items) {
        final station = item.station?.label ?? 'Main Kitchen';
        stationLoads[station] = (stationLoads[station] ?? 0) + 1;
      }
    }

    for (final entry in stationLoads.entries) {
      if (entry.value > 8) {
        bottlenecks.add(BottleneckInfo(
          title: '${entry.key} Congestion',
          description: '${entry.value} items queued at ${entry.key} station.',
          severity: entry.value > 12 ? 'high' : 'medium',
          suggestion: 'Redistribute items to less loaded stations if possible.',
        ));
      }
    }

    final avgAge = active.isNotEmpty
        ? active.fold<int>(0, (sum, o) => sum + o.age.inMinutes) / active.length
        : 0.0;

    if (avgAge > 20) {
      bottlenecks.add(BottleneckInfo(
        title: 'Slow Turnaround',
        description: 'Average order age is ${avgAge.round()} minutes.',
        severity: avgAge > 30 ? 'high' : 'medium',
        suggestion: 'Focus on completing older orders first to reduce queue time.',
      ));
    }

    return bottlenecks;
  }

  double _calculateAvgDelay(List<KitchenOrder> delayed) {
    if (delayed.isEmpty) return 0;
    final totalMinutes = delayed.fold<int>(0, (sum, o) => sum + o.age.inMinutes);
    return totalMinutes / delayed.length;
  }

  List<LoadBalanceSuggestion> _generateLoadBalance(List<KitchenOrder> orders) {
    final suggestions = <LoadBalanceSuggestion>[];

    final stationLoads = <KitchenStationType, int>{};
    for (final order in orders.where((o) => o.status.isActive)) {
      for (final item in order.items) {
        final station = item.station ?? KitchenStationType.mainKitchen;
        stationLoads[station] = (stationLoads[station] ?? 0) + 1;
      }
    }

    final sortedStations = stationLoads.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    if (sortedStations.length >= 2) {
      final heaviest = sortedStations.first;
      final lightest = sortedStations.last;

      if (heaviest.value - lightest.value > 3) {
        suggestions.add(LoadBalanceSuggestion(
          chefName: 'Move 1-2 items',
          reason: '${heaviest.key.label} has ${heaviest.value} items vs ${lightest.key.label} with ${lightest.value}',
        ));
      }
    }

    final chefLoads = <String, int>{};
    for (final order in orders.where((o) => o.status.isActive)) {
      if (order.assignedChefName != null) {
        chefLoads[order.assignedChefName!] = (chefLoads[order.assignedChefName!] ?? 0) + 1;
      }
    }

    if (chefLoads.isNotEmpty) {
      final sorted = chefLoads.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
      if (sorted.first.value > 5) {
        suggestions.add(LoadBalanceSuggestion(
          chefName: sorted.first.key,
          reason: 'Currently has ${sorted.first.value} active orders - consider redistributing',
        ));
      }
    }

    if (suggestions.isEmpty) {
      suggestions.add(LoadBalanceSuggestion(
        chefName: 'Kitchen Load Balanced',
        reason: 'All stations and chefs are operating within optimal capacity',
      ));
    }

    return suggestions;
  }

  List<ForecastEntry> _generateForecast(List<KitchenOrder> orders, KitchenMetrics metrics) {
    final forecast = <ForecastEntry>[];

    final recentOrders = orders.where((o) =>
        DateTime.now().difference(o.createdAt).inHours < 2).toList();
    final ordersPerHour = recentOrders.isNotEmpty ? recentOrders.length / 2.0 : 0.0;

    if (ordersPerHour > 8) {
      forecast.add(ForecastEntry(
        timeRange: 'Next 30 minutes',
        description: 'High volume expected based on current trend',
        expectedOrders: (ordersPerHour * 0.5).round(),
        level: 'high',
      ));
    } else if (ordersPerHour > 4) {
      forecast.add(ForecastEntry(
        timeRange: 'Next 30 minutes',
        description: 'Moderate volume expected',
        expectedOrders: (ordersPerHour * 0.5).round(),
        level: 'medium',
      ));
    } else {
      forecast.add(ForecastEntry(
        timeRange: 'Next 30 minutes',
        description: 'Low volume expected',
        expectedOrders: (ordersPerHour * 0.5).round().clamp(1, 5),
        level: 'low',
      ));
    }

    final hour = DateTime.now().hour;
    if (hour >= 11 && hour <= 13) {
      forecast.add(ForecastEntry(
        timeRange: 'Lunch Peak (12:00-14:00)',
        description: 'Lunch rush is active - expect sustained high volume',
        expectedOrders: 25,
        level: 'high',
      ));
    } else if (hour >= 18 && hour <= 21) {
      forecast.add(ForecastEntry(
        timeRange: 'Dinner Peak (18:00-21:00)',
        description: 'Dinner service ramping up',
        expectedOrders: 30,
        level: 'high',
      ));
    } else {
      forecast.add(ForecastEntry(
        timeRange: 'Off-Peak',
        description: 'Steady flow expected',
        expectedOrders: 8,
        level: 'low',
      ));
    }

    final avgTime = metrics.avgTicketTimeMinutes > 0 ? metrics.avgTicketTimeMinutes : 15.0;
    forecast.add(ForecastEntry(
      timeRange: 'Avg Ticket Time',
      description: 'Current average: ${avgTime.round()} min per order',
      expectedOrders: avgTime.round(),
      level: avgTime > 25 ? 'high' : avgTime > 15 ? 'medium' : 'low',
    ));

    return forecast;
  }
}

// ─── AI Models ───

class TimePrediction {
  final String orderId;
  final String orderDisplay;
  final String tableName;
  final int estimatedMinutes;
  final double confidence;
  const TimePrediction({
    required this.orderId,
    required this.orderDisplay,
    required this.tableName,
    required this.estimatedMinutes,
    required this.confidence,
  });
}

class BottleneckInfo {
  final String title;
  final String description;
  final String severity;
  final String suggestion;
  const BottleneckInfo({
    required this.title,
    required this.description,
    required this.severity,
    required this.suggestion,
  });
}

class LoadBalanceSuggestion {
  final String chefName;
  final String reason;
  const LoadBalanceSuggestion({
    required this.chefName,
    required this.reason,
  });
}

class ForecastEntry {
  final String timeRange;
  final String description;
  final int expectedOrders;
  final String level;
  const ForecastEntry({
    required this.timeRange,
    required this.description,
    required this.expectedOrders,
    required this.level,
  });
}
