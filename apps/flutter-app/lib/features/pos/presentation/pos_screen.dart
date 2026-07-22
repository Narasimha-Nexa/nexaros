import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../providers/pos_provider.dart';
import '../../../core/sync/offline_order_service.dart';
import '../../../core/hardware/receipt_formatter.dart';
import '../../../shared/widgets/shared_widgets.dart';

class POSScreen extends ConsumerStatefulWidget {
  final String? tableId;
  final String? orderId;
  const POSScreen({super.key, this.tableId, this.orderId});

  @override
  ConsumerState<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends ConsumerState<POSScreen> {
  late final _appState;
  bool _isCreatingOrder = false;
  bool _isOffline = false;
  String? _currentOrderId;
  int? _currentOrderNumber;
  String _orderType = 'DINE_IN';
  bool _authChecked = false;

  @override
  void initState() {
    super.initState();
    _appState = ref.read(appStateProvider);
    _currentOrderId = widget.orderId;
    _checkPinAuth();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_authChecked) {
      _authChecked = true;
      final pos = ref.read(posProvider.notifier);
      if (pos.state.menuItems.isEmpty) pos.loadMenu();
    }
  }

  Future<bool> _checkPinAuth() async {
    final api = _appState.api;
    if (await api.hasValidSession()) return true;
    if (!mounted) return false;
    final pinCtrl = TextEditingController();
    final authenticated = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(children: [
          Icon(Icons.lock_outline, size: 20),
          SizedBox(width: 8),
          Text('Staff PIN Required'),
        ]),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter your PIN to access POS'),
            const SizedBox(height: 16),
            TextField(
              controller: pinCtrl,
              obscureText: true,
              maxLength: 6,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'PIN',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, pinCtrl.text.length >= 4),
            child: const Text('Verify'),
          ),
        ],
      ),
    );
    return authenticated == true;
  }

  double get _cartSubtotal => ref.read(posProvider).cart.subtotal;
  double get _taxAmount => _cartSubtotal * 0.05;
  double get _finalTotal => _cartSubtotal + _taxAmount;

  Future<void> _placeOrder(PosProvider pos) async {
    if (pos.cart.isEmpty) return;
    setState(() => _isCreatingOrder = true);
    try {
      final items = pos.cart.items.map((c) => OfflineOrderItem(
        menuItemId: c.menuItemId,
        name: c.name,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
      )).toList();

      if (_currentOrderId != null && !_isOffline) {
        final api = _appState.api;
        for (final item in pos.cart.items) {
          await api.addItemToOrder(_currentOrderId!, {
            'menuItemId': item.menuItemId,
            'name': item.name,
            'quantity': item.quantity,
            'unitPrice': item.unitPrice,
          });
        }
      } else {
        final result = await _appState.offlineOrders.createOrder(
          branchId: _appState.branchId ?? '',
          tableId: widget.tableId,
          type: _orderType,
          items: items,
        );
        _currentOrderId = result.orderId;
        _currentOrderNumber = result.orderNumber;
      }

      if (mounted && _currentOrderId != null) {
        _printKotForOrder(_currentOrderId!, items);
      }

      if (mounted) {
        final msg = _isOffline ? 'Order saved offline! #$_currentOrderNumber' : 'Order placed successfully!';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: _isOffline ? AppColors.warning : AppColors.success),
        );
        pos.clearCart();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: AppColors.danger),
        );
      }
    }
    if (mounted) setState(() => _isCreatingOrder = false);
  }

  Future<void> _printKotForOrder(String orderId, List<OfflineOrderItem> items) async {
    try {
      final kotData = ReceiptFormatter.buildKot(
        restaurantName: 'NexaROS',
        tableName: widget.tableId != null ? 'Table ${widget.tableId}' : 'Takeaway',
        orderNumber: _currentOrderNumber ?? 0,
        items: items.map((i) => ReceiptItem(
          name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.unitPrice * i.quantity,
        )).toList(),
        date: DateTime.now(),
      );
      final printed = await _appState.printer.printKot(kotData);
      if (!printed) debugPrint('KOT printing failed');
    } catch (e) {
      debugPrint('KOT printing error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Order'),
        actions: [
          if (_isOffline)
            Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.wifi_off, size: 14, color: AppColors.warning),
                const SizedBox(width: 4),
                Text('Offline', style: TextStyle(fontSize: 11, color: AppColors.warning, fontWeight: FontWeight.w500)),
              ]),
            ),
          if (_currentOrderId != null)
            TextButton.icon(
              onPressed: () => context.push('/shell/orders'),
              icon: const Icon(Icons.receipt_long, size: 18),
              label: const Text('View Orders'),
            ),
        ],
      ),
      body: Builder(
        builder: (context) {
          final pos = ref.watch(posProvider);
          final deviceType = ResponsiveLayout.deviceType(context);
          return deviceType != DeviceType.mobile ? _buildWideLayout(pos) : _buildNarrowLayout(pos);
        },
      ),
    );
  }

  Widget _buildWideLayout(PosProvider pos) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        Expanded(flex: 3, child: _buildMenuPanel(pos)),
        Container(
          width: 380,
          decoration: BoxDecoration(
            color: cs.surface,
            border: Border(left: BorderSide(color: cs.outline)),
          ),
          child: _buildCartPanel(pos),
        ),
      ],
    );
  }

  Widget _buildNarrowLayout(PosProvider pos) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Expanded(child: _buildMenuPanel(pos)),
        if (!pos.cart.isEmpty)
          Container(
            padding: const EdgeInsets.all(12),
            color: cs.surface,
            child: Row(children: [
              Text('${pos.cart.itemCount} items', style: const TextStyle(fontWeight: FontWeight.w600)),
              const Spacer(),
              Text('₹${_cartSubtotal.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: cs.primary)),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _isCreatingOrder ? null : () => _placeOrder(pos),
                child: _isCreatingOrder
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Place Order'),
              ),
            ]),
          ),
      ],
    );
  }

  Widget _buildMenuPanel(PosProvider pos) {
    final cs = Theme.of(context).colorScheme;
    final deviceType = ResponsiveLayout.deviceType(context);
    return Column(
      children: [
        Container(
          color: cs.surface,
          padding: const EdgeInsets.all(12),
          child: Column(children: [
            NxSearchBar(
              hintText: 'Search menu items...',
              onChanged: (v) => pos.searchMenu(v),
              onClear: () => pos.searchMenu(''),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: const Text('All', style: TextStyle(fontSize: 12)),
                      selected: pos.state.selectedCategoryId == null,
                      onSelected: (_) => pos.selectCategory(null),
                    ),
                  ),
                  ...pos.state.categories.map((cat) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(cat['name'] ?? '', style: const TextStyle(fontSize: 12)),
                      selected: pos.state.selectedCategoryId == cat['id'],
                      onSelected: (_) => pos.selectCategory(cat['id']),
                    ),
                  )),
                ],
              ),
            ),
          ]),
        ),
        Expanded(
          child: pos.state.isLoading
              ? const NxFullScreenLoader()
              : pos.state.filteredMenuItems.isEmpty
                  ? const NxEmptyState(icon: Icons.restaurant_menu, title: 'No items found')
                  : GridView.builder(
                      padding: const EdgeInsets.all(12),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: deviceType == DeviceType.desktop ? 4 : deviceType == DeviceType.tablet ? 3 : 2,
                        childAspectRatio: 1.4,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: pos.state.filteredMenuItems.length,
                      itemBuilder: (ctx, i) => _buildMenuCard(pos.state.filteredMenuItems[i], pos),
                    ),
        ),
      ],
    );
  }

  Widget _buildMenuCard(Map<String, dynamic> item, PosProvider pos) {
    final price = double.tryParse(item['price'].toString()) ?? 0;
    final cs = Theme.of(context).colorScheme;
    return Card(
      child: InkWell(
        onTap: () => pos.addToCart(item),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(
                  width: 10, height: 10,
                  decoration: BoxDecoration(
                    border: Border.all(color: item['isVeg'] == true ? AppColors.success : AppColors.danger, width: 1.5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                  child: Center(
                    child: Container(
                      width: 5, height: 5,
                      decoration: BoxDecoration(
                        color: item['isVeg'] == true ? AppColors.success : AppColors.danger,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                if (item['isAvailable'] == false)
                  NxStatusBadge(label: 'Unavailable', color: AppColors.danger, small: true),
              ]),
              const SizedBox(height: 6),
              Expanded(
                child: Text(item['name'] ?? '', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurface), maxLines: 2, overflow: TextOverflow.ellipsis),
              ),
              Text('₹${price.toStringAsFixed(0)}', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: cs.primary)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCartPanel(PosProvider pos) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: cs.outline))),
          child: Row(children: [
            Text('Order', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: cs.onSurface)),
            const Spacer(),
            if (_currentOrderId != null)
              NxStatusBadge(label: 'Table Order', color: AppColors.primary),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'].map((type) {
              final labels = {'DINE_IN': 'Dine In', 'TAKEAWAY': 'Takeaway', 'DELIVERY': 'Delivery'};
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(labels[type]!, style: const TextStyle(fontSize: 12)),
                  selected: _orderType == type,
                  onSelected: (_) {
                    setState(() => _orderType = type);
                    pos.setOrderType(type);
                  },
                ),
              );
            }).toList(),
          ),
        ),
        Expanded(
          child: pos.cart.isEmpty
              ? const NxEmptyState(icon: Icons.shopping_cart_outlined, title: 'Tap items to add')
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: pos.cart.items.length,
                  itemBuilder: (ctx, i) => _buildCartItem(pos.cart.items[i], pos),
                ),
        ),
        if (!pos.cart.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(border: Border(top: BorderSide(color: cs.outline))),
            child: Column(children: [
              _totalRow('Subtotal', '₹${_cartSubtotal.toStringAsFixed(2)}'),
              const SizedBox(height: 4),
              _totalRow('Tax (5%)', '₹${_taxAmount.toStringAsFixed(2)}'),
              const Divider(),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: cs.onSurface)),
                Text('₹${_finalTotal.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: cs.primary)),
              ]),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity, height: 44,
                child: ElevatedButton(
                  onPressed: _isCreatingOrder ? null : () => _placeOrder(pos),
                  child: _isCreatingOrder
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_currentOrderId != null ? 'Add to Order' : 'Place Order'),
                ),
              ),
            ]),
          ),
      ],
    );
  }

  Widget _totalRow(String label, String value) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: TextStyle(color: AppColors.gray600)),
      Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
    ]);
  }

  Widget _buildCartItem(dynamic item, PosProvider pos) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(children: [
        Container(
          width: 8, height: 8,
          decoration: BoxDecoration(
            color: item.isVeg ? AppColors.success : AppColors.danger,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.name, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: cs.onSurface)),
              Text('₹${item.unitPrice.toStringAsFixed(0)} each', style: TextStyle(fontSize: 11, color: AppColors.gray500)),
            ],
          ),
        ),
        IconButton(
          onPressed: () => pos.removeFromCart(item.id),
          icon: const Icon(Icons.remove_circle_outline, size: 20, color: AppColors.danger),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
        IconButton(
          onPressed: () => pos.updateCartQuantity(item.id, item.quantity + 1),
          icon: const Icon(Icons.add_circle_outline, size: 20, color: AppColors.primary),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
      ]),
    );
  }
}
