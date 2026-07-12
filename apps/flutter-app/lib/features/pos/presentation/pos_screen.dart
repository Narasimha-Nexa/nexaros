import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/api_client.dart';
import '../../orders/presentation/order_list_screen.dart';

class POSScreen extends StatefulWidget {
  final String? tableId;
  final String? orderId;
  const POSScreen({super.key, this.tableId, this.orderId});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  final _api = ApiClient();
  List<dynamic> _categories = [];
  List<dynamic> _menuItems = [];
  List<dynamic> _filteredItems = [];
  final List<Map<String, dynamic>> _cart = [];
  String? _selectedCategoryId;
  String _searchQuery = '';
  bool _isLoading = true;
  bool _isCreatingOrder = false;
  String? _currentOrderId;
  String _orderType = 'DINE_IN';

  @override
  void initState() {
    super.initState();
    _currentOrderId = widget.orderId;
    _loadMenu();
  }

  Future<void> _loadMenu() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.getCategories(),
        _api.getMenuItems(),
      ]);
      if (mounted) {
        setState(() {
          _categories = results[0];
          _menuItems = results[1];
          _filteredItems = _menuItems;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _filterMenu(String? categoryId, String search) {
    setState(() {
      _selectedCategoryId = categoryId;
      _searchQuery = search;
      _filteredItems = _menuItems.where((item) {
        final matchesCategory = categoryId == null || item['categoryId'] == categoryId;
        final matchesSearch = search.isEmpty || item['name'].toLowerCase().contains(search.toLowerCase());
        final isAvailable = item['isAvailable'] == true;
        return matchesCategory && matchesSearch && isAvailable;
      }).toList();
    });
  }

  void _addToCart(Map<String, dynamic> item) {
    final existing = _cart.indexWhere((c) => c['menuItemId'] == item['id']);
    if (existing >= 0) {
      setState(() => _cart[existing]['quantity']++);
    } else {
      setState(() {
        _cart.add({
          'menuItemId': item['id'],
          'name': item['name'],
          'unitPrice': double.tryParse(item['price'].toString()) ?? 0,
          'quantity': 1,
          'isVeg': item['isVeg'] ?? false,
        });
      });
    }
  }

  void _removeFromCart(int index) {
    if (_cart[index]['quantity'] > 1) {
      setState(() => _cart[index]['quantity']--);
    } else {
      setState(() => _cart.removeAt(index));
    }
  }

  double get _cartTotal => _cart.fold(0, (sum, c) => sum + (c['unitPrice'] * c['quantity']));
  int get _cartItemCount => _cart.fold(0, (sum, c) => sum + (c['quantity'] as int));

  Future<void> _placeOrder() async {
    if (_cart.isEmpty) return;
    setState(() => _isCreatingOrder = true);
    try {
      if (_currentOrderId != null) {
        for (final item in _cart) {
          await _api.addItemToOrder(_currentOrderId!, {
            'menuItemId': item['menuItemId'],
            'name': item['name'],
            'quantity': item['quantity'],
            'unitPrice': item['unitPrice'],
          });
        }
      } else {
        final orderData = {
          'type': _orderType,
          'items': _cart.map((c) => ({
            'menuItemId': c['menuItemId'],
            'name': c['name'],
            'quantity': c['quantity'],
            'unitPrice': c['unitPrice'],
          })).toList(),
        };
        if (widget.tableId != null) orderData['tableId'] = widget.tableId!;
        final result = await _api.createOrder(orderData);
        _currentOrderId = result['id'];
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_currentOrderId != null ? 'Order placed successfully!' : 'Order updated!'), backgroundColor: AppColors.success),
        );
        setState(() => _cart.clear());
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

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 900;
    return Scaffold(
      appBar: AppBar(
        title: Text('New Order', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        actions: [
          if (_currentOrderId != null)
            TextButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrderListScreen())),
              icon: const Icon(Icons.receipt_long, size: 18),
              label: const Text('View Orders'),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: isWide ? _buildWideLayout() : _buildNarrowLayout(),
    );
  }

  Widget _buildWideLayout() {
    return Row(
      children: [
        Expanded(flex: 3, child: _buildMenuPanel()),
        Container(width: 380, color: AppColors.white, child: _buildCartPanel()),
      ],
    );
  }

  Widget _buildNarrowLayout() {
    return Column(
      children: [
        Expanded(child: _buildMenuPanel()),
        if (_cart.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(12),
            color: AppColors.white,
            child: Row(
              children: [
                Text('$_cartItemCount items', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                const Spacer(),
                Text('₹${_cartTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primary)),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: _isCreatingOrder ? null : _placeOrder,
                  child: _isCreatingOrder
                      ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Place Order'),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildMenuPanel() {
    return Column(
      children: [
        // Search + Category chips
        Container(
          color: AppColors.white,
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              TextField(
                onChanged: (v) => _filterMenu(_selectedCategoryId, v),
                decoration: InputDecoration(
                  hintText: 'Search menu items...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
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
                        label: const Text('All'),
                        selected: _selectedCategoryId == null,
                        onSelected: (_) => _filterMenu(null, _searchQuery),
                        selectedColor: AppColors.primary100,
                        checkmarkColor: AppColors.primary,
                        labelStyle: GoogleFonts.inter(fontSize: 12),
                      ),
                    ),
                    ..._categories.map((cat) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: FilterChip(
                        label: Text(cat['name']),
                        selected: _selectedCategoryId == cat['id'],
                        onSelected: (_) => _filterMenu(cat['id'], _searchQuery),
                        selectedColor: AppColors.primary100,
                        checkmarkColor: AppColors.primary,
                        labelStyle: GoogleFonts.inter(fontSize: 12),
                      ),
                    )),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Menu grid
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _filteredItems.isEmpty
                  ? Center(child: Text('No items found', style: GoogleFonts.inter(color: AppColors.gray400)))
                  : GridView.builder(
                      padding: const EdgeInsets.all(12),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: isWide ? 3 : 2,
                        childAspectRatio: 1.4,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: _filteredItems.length,
                      itemBuilder: (ctx, i) => _buildMenuCard(_filteredItems[i]),
                    ),
        ),
      ],
    );
  }

  bool get isWide => MediaQuery.of(context).size.width > 900;

  Widget _buildMenuCard(Map<String, dynamic> item) {
    final price = double.tryParse(item['price'].toString()) ?? 0;
    return Card(
      child: InkWell(
        onTap: () => _addToCart(item),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      border: Border.all(color: item['isVeg'] == true ? AppColors.success : AppColors.danger, width: 1.5),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: Center(
                      child: Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          color: item['isVeg'] == true ? AppColors.success : AppColors.danger,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                  const Spacer(),
                  if (item['isAvailable'] == false)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.danger.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(4)),
                      child: const Text('Unavailable', style: TextStyle(fontSize: 9, color: AppColors.danger)),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Expanded(
                child: Text(
                  item['name'] ?? '',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                '₹${price.toStringAsFixed(0)}',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCartPanel() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.gray200))),
          child: Row(
            children: [
              Text('Order', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
              const Spacer(),
              if (_currentOrderId != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.primary100, borderRadius: BorderRadius.circular(4)),
                  child: Text('Table Order', style: GoogleFonts.inter(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600)),
                ),
            ],
          ),
        ),
        // Order type selector
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'].map((type) {
              final isSelected = _orderType == type;
              final labels = {'DINE_IN': 'Dine In', 'TAKEAWAY': 'Takeaway', 'DELIVERY': 'Delivery'};
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(labels[type]!, style: GoogleFonts.inter(fontSize: 12)),
                  selected: isSelected,
                  onSelected: (_) => setState(() => _orderType = type),
                  selectedColor: AppColors.primary100,
                  checkmarkColor: AppColors.primary,
                ),
              );
            }).toList(),
          ),
        ),
        // Cart items
        Expanded(
          child: _cart.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 48, color: AppColors.gray300),
                      const SizedBox(height: 8),
                      Text('Tap items to add', style: GoogleFonts.inter(color: AppColors.gray400)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _cart.length,
                  itemBuilder: (ctx, i) => _buildCartItem(i),
                ),
        ),
        // Totals
        if (_cart.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(border: Border(top: BorderSide(color: AppColors.gray200))),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Subtotal', style: GoogleFonts.inter(color: AppColors.gray600)),
                    Text('₹${_cartTotal.toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Tax (5%)', style: GoogleFonts.inter(color: AppColors.gray600)),
                    Text('₹${(_cartTotal * 0.05).toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  ],
                ),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('₹${(_cartTotal * 1.05).toStringAsFixed(2)}', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary)),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: ElevatedButton(
                    onPressed: _isCreatingOrder ? null : _placeOrder,
                    child: _isCreatingOrder
                        ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_currentOrderId != null ? 'Add to Order' : 'Place Order'),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildCartItem(int index) {
    final item = _cart[index];
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: item['isVeg'] == true ? AppColors.success : AppColors.danger,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item['name'], style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500)),
                Text('₹${item['unitPrice'].toStringAsFixed(0)} each', style: GoogleFonts.inter(fontSize: 11, color: AppColors.gray500)),
              ],
            ),
          ),
          IconButton(
            onPressed: () => _removeFromCart(index),
            icon: const Icon(Icons.remove_circle_outline, size: 20, color: AppColors.danger),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text('${item['quantity']}', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
          IconButton(
            onPressed: () => setState(() => _cart[index]['quantity']++),
            icon: const Icon(Icons.add_circle_outline, size: 20, color: AppColors.primary),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}
