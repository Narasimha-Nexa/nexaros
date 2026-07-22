import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/providers/riverpod_providers.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/inventory_models.dart';

class RecipeManagementScreen extends ConsumerStatefulWidget {
  const RecipeManagementScreen({super.key});

  @override
  ConsumerState<RecipeManagementScreen> createState() =>
      _RecipeManagementScreenState();
}

class _RecipeManagementScreenState
    extends ConsumerState<RecipeManagementScreen> {
  late final dynamic _api;
  List<Recipe> _recipes = [];
  bool _isLoading = true;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _api = ref.read(appStateProvider).api;
    _loadRecipes();
  }

  Future<void> _loadRecipes() async {
    setState(() => _isLoading = true);
    try {
      final raw = await _api.getRecipes().catchError((_) => <dynamic>[]);
      if (mounted) {
        setState(() {
          _recipes = (raw as List<dynamic>)
              .map((j) => Recipe.fromJson(j as Map<String, dynamic>))
              .toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Recipe> get _filteredRecipes {
    if (_search.isEmpty) return _recipes;
    final q = _search.toLowerCase();
    return _recipes
        .where((r) =>
            r.name.toLowerCase().contains(q) ||
            (r.description?.toLowerCase().contains(q) ?? false) ||
            (r.menuItemName?.toLowerCase().contains(q) ?? false))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Recipes', style: AppTextStyles.h2),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showRecipeDialog(),
          ),
        ],
      ),
      body: _isLoading
          ? const NxFullScreenLoader()
          : RefreshIndicator(
              onRefresh: _loadRecipes,
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: NxSearchBar(
                      hintText: 'Search recipes...',
                      onChanged: (v) => setState(() => _search = v),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: _filteredRecipes.isEmpty
                        ? NxEmptyState(
                            icon: Icons.restaurant_menu,
                            title: _search.isNotEmpty
                                ? 'No matching recipes'
                                : 'No recipes configured',
                            subtitle: 'Create recipes to track ingredient costs',
                            actionLabel: _search.isNotEmpty ? null : 'Add Recipe',
                            onAction: _search.isNotEmpty ? null : () => _showRecipeDialog(),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filteredRecipes.length,
                            itemBuilder: (ctx, i) =>
                                _buildRecipeCard(_filteredRecipes[i]),
                          ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildRecipeCard(Recipe recipe) {
    return NxCard(
      margin: const EdgeInsets.only(bottom: 10),
      onTap: () => _showRecipeDetail(recipe),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.restaurant,
                  size: 20,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(recipe.name, style: AppTextStyles.h4),
                    if (recipe.description != null &&
                        recipe.description!.isNotEmpty)
                      Text(
                        recipe.description!,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.gray500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹${recipe.costPerServing.toStringAsFixed(2)}',
                    style: AppTextStyles.statValue.copyWith(
                      fontSize: 16,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    'per serving',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.gray400,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.gray50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                _recipeStat(
                  'Yield',
                  '${recipe.yieldQuantity.toStringAsFixed(0)} ${recipe.yieldUnit}',
                  Icons.straighten,
                ),
                const SizedBox(width: 16),
                _recipeStat(
                  'Ingredients',
                  '${recipe.ingredients.length}',
                  Icons.list,
                ),
                const SizedBox(width: 16),
                _recipeStat(
                  'Total Cost',
                  '₹${recipe.totalCost.toStringAsFixed(2)}',
                  Icons.currency_rupee,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _recipeStat(String label, String value, IconData icon) {
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
                style: AppTextStyles.labelSmall.copyWith(
                  color: AppColors.gray800,
                ),
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

  void _showRecipeDetail(Recipe recipe) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.65,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (ctx, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.gray300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(recipe.name, style: AppTextStyles.h2),
              if (recipe.description != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    recipe.description!,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.gray500,
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _detailStat('Cost/Serving',
                        '₹${recipe.costPerServing.toStringAsFixed(2)}'),
                    _detailStat('Yield',
                        '${recipe.yieldQuantity.toStringAsFixed(0)} ${recipe.yieldUnit}'),
                    _detailStat('Prep Cost',
                        '₹${recipe.preparationCost.toStringAsFixed(2)}'),
                    _detailStat(
                        'Total', '₹${recipe.totalCost.toStringAsFixed(2)}'),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text('Ingredients', style: AppTextStyles.h3),
              const SizedBox(height: 8),
              if (recipe.ingredients.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    'No ingredients added yet',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.gray400,
                    ),
                  ),
                )
              else
                ...recipe.ingredients.map((ing) => NxCard(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 10),
                      child: Row(
                        children: [
                          Container(
                            width: 4,
                            height: 32,
                            decoration: BoxDecoration(
                              color: ing.isOptional
                                  ? AppColors.gray300
                                  : AppColors.primary,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ing.itemName ?? 'Unknown',
                                  style: AppTextStyles.labelLarge,
                                ),
                                Text(
                                  '${ing.quantity.toStringAsFixed(2)} ${ing.unit}',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.gray500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '₹${ing.totalCost.toStringAsFixed(2)}',
                                style: AppTextStyles.labelLarge.copyWith(
                                  color: AppColors.primary,
                                ),
                              ),
                              Text(
                                '₹${ing.unitCost.toStringAsFixed(2)}/${ing.unit}',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.gray400,
                                ),
                              ),
                            ],
                          ),
                          if (ing.isOptional) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.gray100,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'OPT',
                                style: AppTextStyles.labelSmall.copyWith(
                                  color: AppColors.gray500,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    )),
              const SizedBox(height: 16),
              Text('Cost Breakdown', style: AppTextStyles.h3),
              const SizedBox(height: 8),
              ...recipe.ingredients.map((ing) {
                final pct = recipe.totalCost > 0
                    ? (ing.totalCost / recipe.totalCost * 100)
                    : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            ing.itemName ?? 'Unknown',
                            style: AppTextStyles.bodyMedium,
                          ),
                          Text(
                            '₹${ing.totalCost.toStringAsFixed(2)} (${pct.toStringAsFixed(0)}%)',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.gray600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value: pct / 100,
                        backgroundColor: AppColors.gray100,
                        color: AppColors.primary,
                        minHeight: 4,
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detailStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: AppTextStyles.statValue.copyWith(fontSize: 14),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.gray500),
        ),
      ],
    );
  }

  void _showRecipeDialog({Recipe? existing}) {
    final nameCtrl = TextEditingController(text: existing?.name ?? '');
    final descCtrl = TextEditingController(text: existing?.description ?? '');
    final yieldQtyCtrl = TextEditingController(
        text: existing?.yieldQuantity.toString() ?? '1');
    final yieldUnitCtrl =
        TextEditingController(text: existing?.yieldUnit ?? 'serving');
    final prepCostCtrl = TextEditingController(
        text: existing?.preparationCost.toString() ?? '0');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(
              existing != null ? Icons.edit : Icons.add_circle,
              size: 20,
              color: AppColors.primary,
            ),
            const SizedBox(width: 8),
            Text(
              existing != null ? 'Edit Recipe' : 'New Recipe',
              style: AppTextStyles.h3,
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Recipe Name *',
                  prefixIcon: Icon(Icons.restaurant, size: 20),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  prefixIcon: Icon(Icons.description, size: 20),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: yieldQtyCtrl,
                      decoration: const InputDecoration(labelText: 'Yield Qty'),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: yieldUnitCtrl,
                      decoration: const InputDecoration(labelText: 'Yield Unit'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: prepCostCtrl,
                decoration: const InputDecoration(
                  labelText: 'Preparation Cost (₹)',
                  prefixIcon: Icon(Icons.currency_rupee, size: 20),
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.trim().isEmpty) {
                ScaffoldMessenger.of(ctx).showSnackBar(
                  const SnackBar(
                    content: Text('Recipe name is required'),
                    backgroundColor: AppColors.danger,
                  ),
                );
                return;
              }
              final data = {
                'name': nameCtrl.text.trim(),
                'description': descCtrl.text.trim(),
                'yieldQuantity': double.tryParse(yieldQtyCtrl.text) ?? 1,
                'yieldUnit': yieldUnitCtrl.text.trim(),
                'preparationCost': double.tryParse(prepCostCtrl.text) ?? 0,
              };
              try {
                if (existing != null) {
                  await _api.updateRecipe(existing.id, data);
                } else {
                  await _api.createRecipe(data);
                }
                if (ctx.mounted) Navigator.pop(ctx);
                _loadRecipes();
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(
                      content: Text('Error: $e'),
                      backgroundColor: AppColors.danger,
                    ),
                  );
                }
              }
            },
            child: Text(existing != null ? 'Update' : 'Create'),
          ),
        ],
      ),
    );
  }
}
