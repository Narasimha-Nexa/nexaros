import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../providers/menu_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import 'menu_item_form_screen.dart';

class MenuManagementScreen extends ConsumerStatefulWidget {
  const MenuManagementScreen({super.key});

  @override
  ConsumerState<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends ConsumerState<MenuManagementScreen> {
  final _searchController = TextEditingController();
  bool _initialLoadDone = false;

  @override
  void initState() {
    super.initState();
    // Trigger initial data load from the globally-provided MenuProvider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_initialLoadDone && mounted) {
        ref.read(menuProvider.notifier).loadItems();
        _initialLoadDone = true;
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Reactively watch MenuProvider — widget rebuilds whenever the provider changes.
    // This replaces the old `addListener(() => setState({}))` pattern.
    final menuProv = ref.watch(menuProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Menu Management', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
              onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => MenuItemFormScreen(
                  menuProvider: ref.read(menuProvider.notifier),
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search menu items...',
                prefixIcon: const Icon(Icons.search, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          menuProv.search('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              onChanged: (v) => menuProv.search(v),
            ),
          ),

          // Category chips
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: const Text('All'),
                    selected: menuProv.selectedCategoryId == null,
                    onSelected: (_) => menuProv.filterByCategory(null),
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(color: menuProv.selectedCategoryId == null ? AppColors.white : AppColors.gray700),
                  ),
                ),
                ...menuProv.categories.map((cat) => Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text('${cat['name']} (${menuProv.getCategoryItemCount(cat['id'])})'),
                    selected: menuProv.selectedCategoryId == cat['id'],
                    onSelected: (_) => menuProv.filterByCategory(cat['id']),
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: menuProv.selectedCategoryId == cat['id'] ? AppColors.white : AppColors.gray700,
                      fontSize: 12,
                    ),
                  ),
                )),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Items list
          Expanded(
            child: menuProv.isLoading
                ? const NxFullScreenLoader()
                : menuProv.items.isEmpty
                    ? const NxEmptyState(
                        icon: Icons.restaurant_menu,
                        title: 'No menu items found',
                      )
                    : RefreshIndicator(
                        onRefresh: () => menuProv.loadItems(),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          itemCount: menuProv.items.length,
                          itemBuilder: (context, index) {
                            final item = menuProv.items[index];
                            return _MenuItemCard(
                              item: item,
                              onToggleAvailability: () => ref.read(menuProvider.notifier).toggleAvailability(item.id),
                              onDelete: () => _confirmDelete(item, menuProv),
                              onEdit: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => MenuItemFormScreen(
                                    menuProvider: ref.read(menuProvider.notifier),
                                    item: item,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(MenuItem item, MenuProvider menuProvider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Item'),
        content: Text('Delete "${item.name}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              menuProvider.deleteItem(item.id);
              Navigator.pop(ctx);
            },
            child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

class _MenuItemCard extends StatelessWidget {
  final MenuItem item;
  final VoidCallback onToggleAvailability;
  final VoidCallback onDelete;
  final VoidCallback onEdit;

  const _MenuItemCard({
    required this.item,
    required this.onToggleAvailability,
    required this.onDelete,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = item.primaryImage;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(8),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: SizedBox(
            width: 56,
            height: 56,
            child: imageUrl != null
                ? CachedNetworkImage(
                    imageUrl: imageUrl.startsWith('http') ? imageUrl : 'http://localhost:4000$imageUrl',
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: AppColors.gray100, child: const Icon(Icons.restaurant, size: 24)),
                    errorWidget: (_, __, ___) => Container(color: AppColors.gray100, child: const Icon(Icons.restaurant, size: 24)),
                  )
                : Container(
                    color: item.isVeg ? Colors.green.shade50 : Colors.red.shade50,
                    child: Icon(
                      Icons.restaurant,
                      size: 24,
                      color: item.isVeg ? Colors.green : Colors.red,
                    ),
                  ),
          ),
        ),
        title: Row(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                border: Border.all(color: item.isVeg ? Colors.green : Colors.red, width: 1.5),
                borderRadius: BorderRadius.circular(2),
              ),
              child: Icon(
                item.isVeg ? Icons.circle : Icons.circle,
                size: 6,
                color: item.isVeg ? Colors.green : Colors.red,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(item.name, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
            ),
          ],
        ),
        subtitle: Row(
          children: [
            Text('₹${item.price.toStringAsFixed(0)}',
                style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.primary)),
            if (item.images.isNotEmpty) ...[
              const SizedBox(width: 8),
              Icon(Icons.photo_library, size: 14, color: AppColors.gray400),
              const SizedBox(width: 2),
              Text('${item.images.length}', style: TextStyle(fontSize: 11, color: AppColors.gray400)),
            ],
          ],
        ),
        trailing: PopupMenuButton(
          itemBuilder: (_) => [
            PopupMenuItem(onTap: onEdit, child: const Row(children: [Icon(Icons.edit, size: 18), SizedBox(width: 8), Text('Edit')])),
            PopupMenuItem(onTap: onToggleAvailability, child: Row(children: [
              Icon(item.isAvailable ? Icons.visibility_off : Icons.visibility, size: 18),
              const SizedBox(width: 8),
              Text(item.isAvailable ? 'Mark Unavailable' : 'Mark Available'),
            ])),
            PopupMenuItem(onTap: onDelete, child: const Row(children: [Icon(Icons.delete, size: 18, color: Colors.red), SizedBox(width: 8), Text('Delete', style: TextStyle(color: Colors.red))])),
          ],
        ),
      ),
    );
  }
}
