import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_dimens.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/pos_models.dart';
import '../providers/pos_provider.dart';
import 'widgets/split_payment_sheet.dart';
import 'receipt_preview_screen.dart';

class EnterprisePosScreen extends ConsumerStatefulWidget {
  const EnterprisePosScreen({super.key});
  @override
  ConsumerState<EnterprisePosScreen> createState() => _EnterprisePosScreenState();
}

class _EnterprisePosScreenState extends ConsumerState<EnterprisePosScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  String _selectedOrderType = 'DINE_IN';
  bool _showCustomerPanel = false;
  bool _showHeldOrders = false;

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pos = ref.watch(posProvider);
    final cs = Theme.of(context).colorScheme;
    final isWide = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      backgroundColor: cs.surface,
      body: RepaintBoundary(
        child: Column(
          children: [
            _buildTopBar(context, pos, cs),
            Expanded(
              child: isWide
                  ? _buildWideLayout(context, pos, cs)
                  : _buildNarrowLayout(context, pos, cs),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, PosProvider pos, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
      ),
      child: Row(
        children: [
          _buildOrderTypeChip('DINE_IN', Icons.restaurant, pos),
          const SizedBox(width: 4),
          _buildOrderTypeChip('TAKEAWAY', Icons.takeout_dining, pos),
          const SizedBox(width: 4),
          _buildOrderTypeChip('DELIVERY', Icons.delivery_dining, pos),
          const SizedBox(width: 8),

          if (_selectedOrderType == 'DINE_IN')
            ActionChip(
              avatar: Icon(Icons.table_chart, size: 16, color: pos.cart.tableId != null ? AppColors.success : cs.onSurface),
              label: Text(pos.cart.tableNumber ?? 'Table', style: GoogleFonts.inter(fontSize: 12)),
              onPressed: () => _showTablePicker(context),
              backgroundColor: pos.cart.tableId != null ? AppColors.success.withValues(alpha: 0.1) : null,
            ),
          if (_selectedOrderType == 'DINE_IN') const SizedBox(width: 8),

          ActionChip(
            avatar: Icon(Icons.person, size: 16, color: pos.cart.customerId != null ? AppColors.primary : cs.onSurface),
            label: Text(pos.cart.customerName ?? 'Guest', style: GoogleFonts.inter(fontSize: 12)),
            onPressed: () => setState(() => _showCustomerPanel = !_showCustomerPanel),
            backgroundColor: pos.cart.customerId != null ? AppColors.primary.withValues(alpha: 0.1) : null,
          ),
          const SizedBox(width: 8),

          if (_selectedOrderType == 'DINE_IN')
            SizedBox(
              width: 80,
              child: TextFormField(
                initialValue: pos.cart.guestCount?.toString() ?? '',
                decoration: InputDecoration(
                  hintText: 'Guests',
                  hintStyle: GoogleFonts.inter(fontSize: 12),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                ),
                keyboardType: TextInputType.number,
                onChanged: (v) => pos.setGuestCount(int.tryParse(v)),
                style: GoogleFonts.inter(fontSize: 12),
              ),
            ),
          if (_selectedOrderType == 'DINE_IN') const SizedBox(width: 8),

          const Spacer(),

          if (pos.state.heldOrders.isNotEmpty)
            Badge(
              label: Text('${pos.state.heldOrders.length}', style: const TextStyle(fontSize: 10)),
              child: IconButton(
                icon: const Icon(Icons.pause_circle_outline, size: 22),
                onPressed: () => setState(() => _showHeldOrders = !_showHeldOrders),
                tooltip: 'Held Orders',
              ),
            ),

          if (pos.state.isOffline)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.cloud_off, size: 14, color: AppColors.warning),
                const SizedBox(width: 4),
                Text('Offline', style: GoogleFonts.inter(fontSize: 11, color: AppColors.warning, fontWeight: FontWeight.w600)),
              ]),
            ),
        ],
      ),
    );
  }

  Widget _buildOrderTypeChip(String type, IconData icon, PosProvider pos) {
    final isSelected = _selectedOrderType == type;
    return FilterChip(
      label: Text(type.replaceAll('_', ' '), style: GoogleFonts.inter(fontSize: 11, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400)),
      avatar: Icon(icon, size: 16),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() => _selectedOrderType = type);
          pos.setOrderType(type);
        }
      },
      visualDensity: VisualDensity.compact,
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }

  Widget _buildWideLayout(BuildContext context, PosProvider pos, ColorScheme cs) {
    return Row(
      children: [
        Expanded(flex: 3, child: _buildMenuBrowser(context, pos, cs)),
        VerticalDivider(width: 1, color: cs.outlineVariant.withValues(alpha: 0.3)),
        Expanded(flex: 2, child: _buildCartPanel(context, pos, cs)),
      ],
    );
  }

  Widget _buildNarrowLayout(BuildContext context, PosProvider pos, ColorScheme cs) {
    return Row(
      children: [
        Expanded(flex: 3, child: _buildMenuBrowser(context, pos, cs)),
        SizedBox(
          width: 320,
          child: _buildCartPanel(context, pos, cs),
        ),
      ],
    );
  }

  // ═══════════════ MENU BROWSER ═══════════════

  Widget _buildMenuBrowser(BuildContext context, PosProvider pos, ColorScheme cs) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: NxSearchBar(
            hintText: 'Search menu items...',
            onChanged: (q) => pos.searchMenu(q),
            autofocus: false,
          ),
        ),

        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: FilterChip(
                  label: Text('All', style: GoogleFonts.inter(fontSize: 12)),
                  selected: pos.state.selectedCategoryId == null,
                  onSelected: (_) => pos.selectCategory(null),
                  visualDensity: VisualDensity.compact,
                ),
              ),
              ...pos.state.categories.map((cat) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: FilterChip(
                  label: Text(cat['name'] ?? '', style: GoogleFonts.inter(fontSize: 12)),
                  selected: pos.state.selectedCategoryId == cat['id'],
                  onSelected: (_) => pos.selectCategory(cat['id']),
                  visualDensity: VisualDensity.compact,
                ),
              )),
            ],
          ),
        ),
        const SizedBox(height: 4),

        Expanded(
          child: pos.state.isLoading
              ? const NxFullScreenLoader()
              : pos.state.filteredMenuItems.isEmpty
                  ? const NxEmptyState(icon: Icons.restaurant_menu, title: 'No menu items found')
                  : _buildMenuGrid(context, pos, cs),
        ),
      ],
    );
  }

  Widget _buildMenuGrid(BuildContext context, PosProvider pos, ColorScheme cs) {
    final items = pos.state.filteredMenuItems;
    return LayoutBuilder(
      builder: (context, constraints) {
        final crossAxisCount = (constraints.maxWidth / 160).floor().clamp(2, 6);
        return GridView.builder(
          padding: const EdgeInsets.all(8),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 0.85,
          ),
          itemCount: items.length,
          itemBuilder: (context, index) => _buildMenuItemCard(context, items[index], pos, cs),
        );
      },
    );
  }

  Widget _buildMenuItemCard(BuildContext context, Map<String, dynamic> item, PosProvider pos, ColorScheme cs) {
    final isAvailable = item['isAvailable'] != false;
    final isVeg = item['isVeg'] == true;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        side: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppDimens.cardRadius),
        onTap: isAvailable ? () => _addToCartWithModifiers(context, item, pos) : null,
        child: Opacity(
          opacity: isAvailable ? 1.0 : 0.5,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 3,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest.withValues(alpha: 0.3),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(AppDimens.cardRadius)),
                  ),
                  child: Stack(
                    children: [
                      Center(
                        child: Icon(
                          isVeg ? Icons.eco : Icons.restaurant,
                          size: 32,
                          color: isVeg ? AppColors.success : AppColors.primary,
                        ),
                      ),
                      Positioned(
                        top: 6, left: 6,
                        child: Container(
                          width: 14, height: 14,
                          decoration: BoxDecoration(
                            border: Border.all(color: isVeg ? AppColors.success : AppColors.danger, width: 1.5),
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: Center(
                            child: Container(
                              width: 7, height: 7,
                              decoration: BoxDecoration(
                                color: isVeg ? AppColors.success : AppColors.danger,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        ),
                      ),
                      if (!isAvailable)
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.5),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(AppDimens.cardRadius)),
                            ),
                            child: Center(
                              child: Text('UNAVAILABLE',
                                style: GoogleFonts.inter(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.all(6),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item['name'] ?? '',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        '₹${item['price'] ?? 0}',
                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _addToCartWithModifiers(BuildContext context, Map<String, dynamic> item, PosProvider pos) {
    final hasModifiers = item['modifierGroups'] != null && (item['modifierGroups'] as List).isNotEmpty;

    if (hasModifiers) {
      _showModifierSheet(context, item, pos);
    } else {
      pos.addToCart(item);
    }
  }

  void _showModifierSheet(BuildContext context, Map<String, dynamic> item, PosProvider pos) {
    final modifierGroups = (item['modifierGroups'] as List?) ?? [];
    final selectedModifiers = <CartItemModifier>[];
    final selectedAddOns = <CartItemModifier>[];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.5, minChildSize: 0.3, maxChildSize: 0.8,
        expand: false,
        builder: (ctx, scrollController) => StatefulBuilder(
          builder: (ctx, setSheetState) => Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(child: Text(item['name'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700))),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    for (final group in modifierGroups)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(group['name'] ?? 'Options',
                              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            for (final opt in (group['options'] ?? []) as List)
                              CheckboxListTile(
                                title: Text(opt['name'] ?? '', style: GoogleFonts.inter(fontSize: 13)),
                                subtitle: opt['price'] != null ? Text('₹${opt['price']}', style: GoogleFonts.inter(fontSize: 11)) : null,
                                value: selectedModifiers.any((m) => m.id == opt['id']),
                                onChanged: (v) {
                                  setSheetState(() {
                                    if (v == true) {
                                      selectedModifiers.add(CartItemModifier(
                                        id: opt['id'] ?? '', name: opt['name'] ?? '',
                                        price: (opt['price'] ?? 0).toDouble(),
                                      ));
                                    } else {
                                      selectedModifiers.removeWhere((m) => m.id == opt['id']);
                                    }
                                  });
                                },
                                dense: true,
                                contentPadding: EdgeInsets.zero,
                              ),
                            const Divider(),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      pos.addToCart(item, modifiers: selectedModifiers, addOns: selectedAddOns);
                      Navigator.pop(ctx);
                    },
                    child: Text('Add to Cart  •  ₹${item['price'] ?? 0}',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════ CART PANEL ═══════════════

  Widget _buildCartPanel(BuildContext context, PosProvider pos, ColorScheme cs) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: cs.surface,
            border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
          ),
          child: Row(
            children: [
              Icon(Icons.shopping_cart, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text('Cart', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
              const SizedBox(width: 6),
              if (pos.cart.itemCount > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                  child: Text('${pos.cart.itemCount}', style: GoogleFonts.inter(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              const Spacer(),
              IconButton(
                icon: Icon(Icons.notes, size: 18, color: cs.onSurface.withValues(alpha: 0.6)),
                onPressed: () => _showOrderNotesDialog(context, pos),
                tooltip: 'Order Notes',
              ),
              if (!pos.cart.isEmpty) ...[
                IconButton(
                  icon: Icon(Icons.pause_circle_outline, size: 18, color: AppColors.warning),
                  onPressed: () => pos.holdOrder(),
                  tooltip: 'Hold Order',
                ),
                IconButton(
                  icon: Icon(Icons.delete_outline, size: 18, color: AppColors.danger),
                  onPressed: () => _confirmClearCart(context, pos),
                  tooltip: 'Clear Cart',
                ),
              ],
            ],
          ),
        ),

        Expanded(
          child: pos.cart.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 48, color: cs.outline.withValues(alpha: 0.4)),
                      const SizedBox(height: 12),
                      Text('Cart is empty', style: GoogleFonts.inter(color: cs.outline, fontSize: 14)),
                      const SizedBox(height: 4),
                      Text('Tap menu items to add', style: GoogleFonts.inter(color: cs.outline, fontSize: 12)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(8),
                  itemCount: pos.cart.items.length,
                  itemBuilder: (context, index) {
                    final item = pos.cart.items[index];
                    return _buildCartItemTile(context, item, pos, cs);
                  },
                ),
        ),

        _buildOrderSummary(context, pos, cs),

        if (_showHeldOrders && pos.state.heldOrders.isNotEmpty)
          _buildHeldOrdersPanel(context, pos, cs),
      ],
    );
  }

  Widget _buildCartItemTile(BuildContext context, CartItem item, PosProvider pos, ColorScheme cs) {
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: item.isVoided ? AppColors.danger.withValues(alpha: 0.3) : cs.outlineVariant.withValues(alpha: 0.2)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Row(
          children: [
            Container(
              width: 12, height: 12,
              decoration: BoxDecoration(
                border: Border.all(color: item.isVeg ? AppColors.success : AppColors.danger, width: 1.5),
                borderRadius: BorderRadius.circular(2),
              ),
              child: Center(
                child: Container(
                  width: 6, height: 6,
                  decoration: BoxDecoration(
                    color: item.isVeg ? AppColors.success : AppColors.danger,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name,
                    style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600,
                      decoration: item.isVoided ? TextDecoration.lineThrough : null),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                  if (item.notes != null && item.notes!.isNotEmpty)
                    Text(item.notes!, style: GoogleFonts.inter(fontSize: 10, color: cs.outline), maxLines: 1),
                  if (item.modifiers.isNotEmpty)
                    Text(item.modifiers.where((m) => m.isSelected).map((m) => m.name).join(', '),
                      style: GoogleFonts.inter(fontSize: 10, color: AppColors.primary), maxLines: 1),
                ],
              ),
            ),
            if (!item.isVoided)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _qtyBtn(Icons.remove, () => pos.updateCartQuantity(item.id, item.quantity - 1), cs),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Text('${item.quantity}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
                  ),
                  _qtyBtn(Icons.add, () => pos.updateCartQuantity(item.id, item.quantity + 1), cs),
                ],
              ),
            const SizedBox(width: 8),
            Text('₹${item.lineTotal.toStringAsFixed(0)}',
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700)),
            PopupMenuButton<String>(
              itemBuilder: (_) => [
                const PopupMenuItem(value: 'notes', child: Text('Add Notes')),
                if (!item.isVoided) const PopupMenuItem(value: 'void', child: Text('Void Item', style: TextStyle(color: Colors.red))),
                const PopupMenuItem(value: 'remove', child: Text('Remove', style: TextStyle(color: Colors.red))),
              ],
              onSelected: (v) {
                if (v == 'notes') _showItemNotesDialog(context, item, pos);
                if (v == 'void') pos.voidCartItem(item.id);
                if (v == 'remove') pos.removeFromCart(item.id);
              },
              icon: Icon(Icons.more_vert, size: 16, color: cs.outline),
              padding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap, ColorScheme cs) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.5)),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Icon(icon, size: 14),
      ),
    );
  }

  Widget _buildOrderSummary(BuildContext context, PosProvider pos, ColorScheme cs) {
    final billing = pos.state.billing;
    if (billing == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(top: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _summaryRow('Subtotal', '₹${billing.subtotal.toStringAsFixed(0)}', cs),
          if (billing.discountAmount > 0)
            _summaryRow('Discount', '-₹${billing.discountAmount.toStringAsFixed(0)}', cs, color: AppColors.success),
          _summaryRow('Tax (GST)', '₹${billing.taxAmount.toStringAsFixed(0)}', cs),
          if (billing.serviceCharge > 0)
            _summaryRow('Service Charge', '₹${billing.serviceCharge.toStringAsFixed(0)}', cs),
          if (billing.tipAmount > 0)
            _summaryRow('Tip', '₹${billing.tipAmount.toStringAsFixed(0)}', cs),
          if (billing.roundOff != 0)
            _summaryRow('Round Off', '${billing.roundOff >= 0 ? '+' : ''}₹${billing.roundOff.toStringAsFixed(2)}', cs),
          const Divider(height: 12),
          _summaryRow('Total', '₹${billing.totalAmount.toStringAsFixed(0)}', cs, bold: true, fontSize: 16),

          if (billing.amountDue > 0)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: _summaryRow('Due', '₹${billing.amountDue.toStringAsFixed(0)}', cs, color: AppColors.danger),
            ),
          if (billing.changeAmount > 0)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: _summaryRow('Change', '₹${billing.changeAmount.toStringAsFixed(0)}', cs, color: AppColors.success),
            ),

          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showDiscountSheet(context, pos),
                  icon: const Icon(Icons.local_offer, size: 16),
                  label: Text('Discount', style: GoogleFonts.inter(fontSize: 12)),
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showTipSheet(context, pos),
                  icon: const Icon(Icons.volunteer_activism, size: 16),
                  label: Text('Tip', style: GoogleFonts.inter(fontSize: 12)),
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: pos.cart.isEmpty ? null : () => _processPayment(context, pos),
              icon: const Icon(Icons.payment, size: 18),
              label: Text(
                billing.amountDue > 0
                    ? 'Pay ₹${billing.amountDue.toStringAsFixed(0)}'
                    : 'Place Order  •  ₹${billing.totalAmount.toStringAsFixed(0)}',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: cs.outlineVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, ColorScheme cs, {bool bold = false, double fontSize = 13, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: fontSize - 1, fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
            color: color ?? cs.onSurface.withValues(alpha: 0.7))),
          Text(value, style: GoogleFonts.inter(fontSize: fontSize, fontWeight: bold ? FontWeight.w700 : FontWeight.w600,
            color: color ?? cs.onSurface)),
        ],
      ),
    );
  }

  // ═══════════════ HELD ORDERS ═══════════════

  Widget _buildHeldOrdersPanel(BuildContext context, PosProvider pos, ColorScheme cs) {
    return Container(
      height: 120,
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.05),
        border: Border(top: BorderSide(color: AppColors.warning.withValues(alpha: 0.3))),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            child: Row(
              children: [
                Icon(Icons.pause_circle, size: 16, color: AppColors.warning),
                const SizedBox(width: 6),
                Text('Held Orders', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, size: 16),
                  onPressed: () => setState(() => _showHeldOrders = false),
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: pos.state.heldOrders.length,
              itemBuilder: (context, index) {
                final held = pos.state.heldOrders[index];
                return Card(
                  margin: const EdgeInsets.only(right: 8),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () {
                      pos.recallOrder(held.id);
                      setState(() => _showHeldOrders = false);
                    },
                    child: SizedBox(
                      width: 150,
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Order #${index + 1}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700)),
                            Text('${held.cart.itemCount} items • ₹${held.cart.subtotal.toStringAsFixed(0)}',
                              style: GoogleFonts.inter(fontSize: 11, color: cs.outline)),
                            Text('${held.heldAt.hour}:${held.heldAt.minute.toString().padLeft(2, '0')}',
                              style: GoogleFonts.inter(fontSize: 10, color: cs.outline)),
                            const Spacer(),
                            Text('Tap to recall', style: GoogleFonts.inter(fontSize: 10, color: AppColors.primary)),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════ DIALOGS ═══════════════

  void _showTablePicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Select Table', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text('Navigate to Tables screen to assign a table',
              style: GoogleFonts.inter(fontSize: 13, color: Theme.of(ctx).colorScheme.outline)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      ref.read(posProvider.notifier).setTable(null, null);
                      Navigator.pop(ctx);
                    },
                    child: const Text('Clear Table'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      context.go('/shell/tables');
                    },
                    child: const Text('Go to Tables'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showOrderNotesDialog(BuildContext context, PosProvider pos) {
    final controller = TextEditingController(text: pos.cart.notes);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Order Notes', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: const InputDecoration(hintText: 'Add special instructions...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              pos.setCartNotes(controller.text.isEmpty ? null : controller.text);
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showItemNotesDialog(BuildContext context, CartItem item, PosProvider pos) {
    final controller = TextEditingController(text: item.notes);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Notes for ${item.name}', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        content: TextField(
          controller: controller,
          maxLines: 2,
          decoration: const InputDecoration(hintText: 'Special instructions...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              pos.updateItemNotes(item.id, controller.text.isEmpty ? null : controller.text);
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _confirmClearCart(BuildContext context, PosProvider pos) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Cart?'),
        content: const Text('This will remove all items from the cart.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              pos.clearCart();
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger, foregroundColor: Colors.white),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  void _showDiscountSheet(BuildContext context, PosProvider pos) {
    final billing = pos.state.billing;
    final orderTotal = billing?.totalAmount ?? 0;
    final amountCtrl = TextEditingController();
    final codeCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Apply Discount', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              decoration: const InputDecoration(labelText: 'Discount Amount (₹)', prefixIcon: Icon(Icons.money_off, size: 20)),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: codeCtrl,
              decoration: const InputDecoration(labelText: 'Discount Code (optional)', prefixIcon: Icon(Icons.tag, size: 20)),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final amount = double.tryParse(amountCtrl.text) ?? 0;
                  if (amount > 0 && amount <= orderTotal) {
                    Navigator.pop(ctx, {'amount': amount, 'code': codeCtrl.text.isNotEmpty ? codeCtrl.text : null});
                  }
                },
                child: const Text('Apply'),
              ),
            ),
          ],
        ),
      ),
    ).then((result) {
      if (result != null) {
        pos.applyDiscount(result['amount'] as double, code: result['code'] as String?);
      }
    });
  }

  void _showTipSheet(BuildContext context, PosProvider pos) {
    final tips = [0, 10, 20, 50, 100];
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Add Tip', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: tips.map((t) => ActionChip(
                label: Text(t == 0 ? 'No Tip' : '₹$t'),
                onPressed: () {
                  pos.setTip(t.toDouble());
                  Navigator.pop(ctx);
                },
              )).toList(),
            ),
          ],
        ),
      ),
    );
  }

  void _processPayment(BuildContext context, PosProvider pos) async {
    final billing = pos.state.billing;
    if (billing == null) return;

    if (billing.amountDue <= 0) {
      final result = await pos.placeOrder();
      if (result != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order #${result.orderNumber} placed${result.isOffline ? ' (offline)' : ''}'),
            backgroundColor: AppColors.success,
          ),
        );

        // Auto-navigate to receipt preview after successful payment
        if (!result.isOffline) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ReceiptPreviewScreen(
                orderId: result.orderId,
                orderNumber: result.orderNumber,
                items: pos.cart.activeItems,
                billing: billing,
                tableName: pos.cart.tableNumber,
                orderType: pos.cart.orderType,
                config: pos.state.receiptConfig,
              ),
            ),
          );
        }
      }
      return;
    }

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Payment Type', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            ListTile(
              leading: Icon(Icons.payment, color: AppColors.primary),
              title: Text('Single Payment', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              subtitle: Text('Pay the full amount with one method', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600)),
              onTap: () {
                Navigator.pop(ctx);
                _showSinglePaymentSheet(context, pos);
              },
            ),
            ListTile(
              leading: Icon(Icons.call_split, color: AppColors.warning),
              title: Text('Split Payment', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              subtitle: Text('Divide payment across multiple methods', style: GoogleFonts.inter(fontSize: 12, color: AppColors.gray600)),
              onTap: () {
                Navigator.pop(ctx);
                _showSplitPaymentSheet(context, pos);
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showSinglePaymentSheet(BuildContext context, PosProvider pos) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => _PaymentSheet(pos: pos),
    ).then((result) {
      if (result == true && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment processed'), backgroundColor: AppColors.success),
        );
      }
    });
  }

  void _showSplitPaymentSheet(BuildContext context, PosProvider pos) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => SplitPaymentSheet(pos: pos),
    ).then((result) {
      if (result == true && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Split payment completed'), backgroundColor: AppColors.success),
        );
      }
    });
  }
}

// ═══════════════ PAYMENT SHEET ═══════════════

class _PaymentSheet extends StatefulWidget {
  final PosProvider pos;
  const _PaymentSheet({required this.pos});

  @override
  State<_PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends State<_PaymentSheet> {
  PosPaymentMethod _selectedMethod = PosPaymentMethod.cash;
  final _amountController = TextEditingController();
  final _referenceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final billing = widget.pos.state.billing;
    if (billing != null) {
      _amountController.text = billing.amountDue.toStringAsFixed(0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final billing = widget.pos.state.billing;
    if (billing == null) return const SizedBox.shrink();
    final cs = Theme.of(context).colorScheme;

    return DraggableScrollableSheet(
      initialChildSize: 0.7, minChildSize: 0.4, maxChildSize: 0.9,
      expand: false,
      builder: (ctx, scrollController) => Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          controller: scrollController,
          children: [
            Center(
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),

            Text('Payment', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Total: ₹${billing.totalAmount.toStringAsFixed(0)}  |  Due: ₹${billing.amountDue.toStringAsFixed(0)}',
              style: GoogleFonts.inter(fontSize: 13, color: cs.outline)),
            const SizedBox(height: 16),

            Text('Payment Method', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6, runSpacing: 6,
              children: PosPaymentMethod.values.take(10).map((m) => ChoiceChip(
                label: Text(m.label, style: GoogleFonts.inter(fontSize: 11)),
                selected: _selectedMethod == m,
                onSelected: (_) => setState(() => _selectedMethod = m),
                avatar: Icon(m.icon, size: 14, color: m.color),
              )).toList(),
            ),
            const SizedBox(height: 16),

            TextFormField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Amount',
                prefixText: '₹ ',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
            const SizedBox(height: 12),

            if (_selectedMethod != PosPaymentMethod.cash)
              TextFormField(
                controller: _referenceController,
                decoration: InputDecoration(
                  labelText: 'Reference / Transaction ID',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),

            if (_selectedMethod != PosPaymentMethod.cash) const SizedBox(height: 16),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  final amount = double.tryParse(_amountController.text) ?? 0;
                  if (amount <= 0) return;
                  widget.pos.addPayment(_selectedMethod, amount, reference: _referenceController.text.isEmpty ? null : _referenceController.text);
                  Navigator.pop(context, true);
                },
                icon: Icon(_selectedMethod.icon, size: 18),
                label: Text('Pay ₹${_amountController.text}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  backgroundColor: _selectedMethod.color,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
