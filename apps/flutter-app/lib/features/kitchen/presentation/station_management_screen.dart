import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../data/kitchen_models.dart';

class StationManagementScreen extends ConsumerWidget {
  const StationManagementScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final kitchen = ref.watch(kitchenProvider);
    final state = kitchen.state;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text('Kitchen Stations', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        backgroundColor: cs.surface,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Station Overview', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...KitchenStationType.values.where((s) => s != KitchenStationType.custom).map((station) {
            final stationOrders = state.getOrdersByStation(station);
            final activeCount = stationOrders.where((o) => o.status.isActive).length;
            final utilization = state.metrics.stationUtilization[station.label] ?? 0;

            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                onTap: () {
                  ref.read(kitchenProvider).setStationFilter(station.name);
                  Navigator.pop(context);
                },
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _stationColor(station).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(station.icon, color: _stationColor(station), size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(station.label, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text('$activeCount active orders', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
                      ]),
                    ),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text('${utilization.toStringAsFixed(0)}%', style: GoogleFonts.inter(
                        fontWeight: FontWeight.w800, fontSize: 18, color: _stationColor(station))),
                      const SizedBox(height: 4),
                      SizedBox(
                        width: 80,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: utilization / 100,
                            backgroundColor: AppColors.gray100,
                            color: utilization > 80 ? AppColors.danger : _stationColor(station),
                            minHeight: 6,
                          ),
                        ),
                      ),
                    ]),
                    const SizedBox(width: 12),
                    Icon(Icons.chevron_right, color: Colors.grey[400]),
                  ]),
                ),
              ),
            );
          }),
        ]),
      ),
    );
  }

  Color _stationColor(KitchenStationType station) {
    switch (station) {
      case KitchenStationType.grill: return const Color(0xFFEA580C);
      case KitchenStationType.pizza: return const Color(0xFFDC2626);
      case KitchenStationType.bakery: return const Color(0xFFF59E0B);
      case KitchenStationType.dessert: return const Color(0xFFEC4899);
      case KitchenStationType.bar: return const Color(0xFF8B5CF6);
      case KitchenStationType.beverages: return const Color(0xFF06B6D4);
      case KitchenStationType.salad: return const Color(0xFF22C55E);
      case KitchenStationType.fryStation: return const Color(0xFFF97316);
      default: return AppColors.primary;
    }
  }
}
