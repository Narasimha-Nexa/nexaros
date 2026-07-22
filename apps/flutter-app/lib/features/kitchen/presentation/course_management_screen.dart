import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/kitchen_models.dart';
import '../providers/kitchen_provider.dart';

class CourseManagementScreen extends ConsumerStatefulWidget {
  const CourseManagementScreen({super.key});

  @override
  ConsumerState<CourseManagementScreen> createState() => _CourseManagementScreenState();
}

class _CourseManagementScreenState extends ConsumerState<CourseManagementScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _selectedOrderId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final kitchen = ref.watch(kitchenProvider);
    final orders = kitchen.state.orders
        .where((o) => o.courseCount > 1 && o.status.isActive)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: Text('Course Management', style: AppTextStyles.h2),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'All Courses'),
            Tab(text: 'Fired'),
            Tab(text: 'Held'),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildCourseList(orders, 'all'),
                _buildCourseList(orders.where((o) => o.firedCourses.isNotEmpty).toList(), 'fired'),
                _buildCourseList(orders.where((o) => o.heldCourses.isNotEmpty).toList(), 'held'),
              ],
            ),
          ),
          if (_selectedOrderId != null) _buildCourseActions(kitchen),
        ],
      ),
    );
  }

  Widget _buildCourseList(List<KitchenOrder> orders, String filter) {
    if (orders.isEmpty) {
      return NxEmptyState(
        icon: Icons.restaurant_menu,
        title: 'No multi-course orders',
        subtitle: filter == 'all'
            ? 'Orders with courses will appear here'
            : 'No orders match this filter',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        final isSelected = _selectedOrderId == order.id;
        return _buildOrderCourseCard(order, isSelected);
      },
    );
  }

  Widget _buildOrderCourseCard(KitchenOrder order, bool isSelected) {
    final courseTypes = <CourseType>{};
    for (final item in order.items) {
      courseTypes.add(item.course);
    }
    final sortedCourses = courseTypes.toList()..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    return GestureDetector(
      onTap: () => setState(() => _selectedOrderId = isSelected ? null : order.id),
      child: NxCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  order.displayOrderNumber,
                  style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: order.status.color.withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    order.status.label,
                    style: AppTextStyles.labelSmall.copyWith(color: order.status.color),
                  ),
                ),
                const Spacer(),
                if (order.isRush)
                  const Icon(Icons.bolt, color: Colors.red, size: 18),
                if (order.isVip)
                  const Icon(Icons.star, color: Colors.amber, size: 18),
                const SizedBox(width: 8),
                Text(
                  order.displayTable.isNotEmpty ? order.displayTable : 'Takeaway',
                  style: AppTextStyles.bodyMedium,
                ),
                if (isSelected) ...[
                  const SizedBox(width: 8),
                  const Icon(Icons.check_circle, color: AppColors.primary, size: 18),
                ],
              ],
            ),
            const SizedBox(height: 12),
            ...sortedCourses.map((course) => _buildCourseProgress(order, course)),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseProgress(KitchenOrder order, CourseType course) {
    final items = order.items.where((i) => i.course == course).toList();
    final completed = items.where((i) => i.status == KitchenOrderStatus.ready || i.status == KitchenOrderStatus.served).length;
    final isFired = order.firedCourses.contains(course.name);
    final isHeld = order.heldCourses.contains(course.name);

    Color statusColor;
    IconData statusIcon;
    String statusLabel;

    if (isHeld) {
      statusColor = Colors.orange;
      statusIcon = Icons.pause_circle_filled;
      statusLabel = 'Held';
    } else if (isFired) {
      statusColor = completed == items.length ? Colors.green : Colors.blue;
      statusIcon = completed == items.length ? Icons.check_circle : Icons.local_fire_department;
      statusLabel = completed == items.length ? 'Ready' : 'Fired';
    } else {
      statusColor = Colors.grey;
      statusIcon = Icons.schedule;
      statusLabel = 'Pending';
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(statusIcon, color: statusColor, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  course.label,
                  style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  '$completed/${items.length} items ready',
                  style: AppTextStyles.bodySmall.copyWith(color: Colors.grey),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: statusColor.withAlpha(30),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              statusLabel,
              style: AppTextStyles.labelSmall.copyWith(color: statusColor),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCourseActions(KitchenProvider kitchen) {
    final order = kitchen.state.orders.firstWhere(
      (o) => o.id == _selectedOrderId,
      orElse: () => kitchen.state.orders.first,
    );

    final courseTypes = <CourseType>{};
    for (final item in order.items) {
      courseTypes.add(item.course);
    }
    final sortedCourses = courseTypes.toList()..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        border: Border(top: BorderSide(color: Colors.grey.withAlpha(50))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Actions for ${order.displayOrderNumber}',
            style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...sortedCourses.map((course) {
            final isFired = order.firedCourses.contains(course.name);
            final isHeld = order.heldCourses.contains(course.name);
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(course.label, style: AppTextStyles.bodyMedium),
                  ),
                  if (!isFired)
                    ElevatedButton.icon(
                      onPressed: () => kitchen.fireCourse(order.id, course),
                      icon: const Icon(Icons.local_fire_department, size: 16),
                      label: const Text('Fire'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  if (isFired && !isHeld)
                    ElevatedButton.icon(
                      onPressed: () => kitchen.holdCourse(order.id, course),
                      icon: const Icon(Icons.pause, size: 16),
                      label: const Text('Hold'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blueGrey,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  if (isFired && !isHeld)
                    const SizedBox(width: 8),
                  if (isHeld)
                    ElevatedButton.icon(
                      onPressed: () => kitchen.fireCourse(order.id, course),
                      icon: const Icon(Icons.play_arrow, size: 16),
                      label: const Text('Resume'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                    ),
                ],
              ),
            );
          }),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    for (final course in sortedCourses) {
                      if (!order.firedCourses.contains(course.name)) {
                        kitchen.fireCourse(order.id, course);
                      }
                    }
                  },
                  icon: const Icon(Icons.restaurant_menu, size: 16),
                  label: const Text('Fire All Courses'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    for (final course in sortedCourses) {
                      if (!order.heldCourses.contains(course.name)) {
                        kitchen.holdCourse(order.id, course);
                      }
                    }
                  },
                  icon: const Icon(Icons.pause_circle, size: 16),
                  label: const Text('Hold All'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange.shade800,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
