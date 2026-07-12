import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

class MenuItem {
  final String id;
  final String name;
  final String? description;
  final double price;
  final bool isVeg;
  final bool isAvailable;
  final String? image;
  final String? categoryId;
  final Map<String, dynamic>? category;
  final List<Map<String, dynamic>> variants;
  final List<Map<String, dynamic>> addOns;
  final List<Map<String, dynamic>> images;

  MenuItem({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    this.isVeg = false,
    this.isAvailable = true,
    this.image,
    this.categoryId,
    this.category,
    this.variants = const [],
    this.addOns = const [],
    this.images = const [],
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      price: double.tryParse(json['price'].toString()) ?? 0,
      isVeg: json['isVeg'] ?? false,
      isAvailable: json['isAvailable'] ?? true,
      image: json['image'],
      categoryId: json['categoryId'],
      category: json['category'],
      variants: (json['variants'] as List?)?.cast<Map<String, dynamic>>() ?? [],
      addOns: (json['addOns'] as List?)?.cast<Map<String, dynamic>>() ?? [],
      images: (json['images'] as List?)?.cast<Map<String, dynamic>>() ?? [],
    );
  }

  String? get primaryImage {
    if (images.isNotEmpty) {
      final primary = images.where((i) => i['isPrimary'] == true).toList();
      if (primary.isNotEmpty) return primary.first['url'];
      return images.first['url'];
    }
    return image;
  }
}

class MenuProvider extends ChangeNotifier {
  final ApiClient _api;

  List<Map<String, dynamic>> _categories = [];
  List<MenuItem> _items = [];
  List<MenuItem> _filteredItems = [];
  bool _isLoading = false;
  String? _error;
  String? _selectedCategoryId;
  String _searchQuery = '';

  MenuProvider(this._api);

  List<Map<String, dynamic>> get categories => _categories;
  List<MenuItem> get items => _selectedCategoryId == null && _searchQuery.isEmpty
      ? _items
      : _filteredItems;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get selectedCategoryId => _selectedCategoryId;
  String get searchQuery => _searchQuery;

  int getCategoryItemCount(String categoryId) {
    return _items.where((i) => i.categoryId == categoryId).length;
  }

  Future<void> loadCategories() async {
    try {
      _categories = (await _api.getCategories()).cast<Map<String, dynamic>>();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> loadItems({String? categoryId, String? search}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _api.getCategories();
      _categories = data.cast<Map<String, dynamic>>();

      final itemsData = await _api.getMenuItems(categoryId: categoryId, search: search);
      _items = itemsData.map((j) => MenuItem.fromJson(j)).toList();
      _applyFilter();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  void filterByCategory(String? categoryId) {
    _selectedCategoryId = categoryId;
    _applyFilter();
    notifyListeners();
  }

  void search(String query) {
    _searchQuery = query;
    _applyFilter();
    notifyListeners();
  }

  void _applyFilter() {
    _filteredItems = _items.where((item) {
      final matchCategory = _selectedCategoryId == null || item.categoryId == _selectedCategoryId;
      final matchSearch = _searchQuery.isEmpty ||
          item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (item.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
      return matchCategory && matchSearch;
    }).toList();
  }

  Future<void> toggleAvailability(String itemId) async {
    try {
      await _api.toggleAvailability(itemId);
      final index = _items.indexWhere((i) => i.id == itemId);
      if (index != -1) {
        final item = _items[index];
        _items[index] = MenuItem(
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          isVeg: item.isVeg,
          isAvailable: !item.isAvailable,
          image: item.image,
          categoryId: item.categoryId,
          category: item.category,
          variants: item.variants,
          addOns: item.addOns,
          images: item.images,
        );
        _applyFilter();
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> deleteItem(String itemId) async {
    try {
      await _api.deleteMenuItem(itemId);
      _items.removeWhere((i) => i.id == itemId);
      _applyFilter();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> createItem(Map<String, dynamic> data) async {
    try {
      await _api.createMenuItem(data);
      await loadItems(categoryId: _selectedCategoryId, search: _searchQuery);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateItem(String id, Map<String, dynamic> data) async {
    try {
      await _api.updateMenuItem(id, data);
      await loadItems(categoryId: _selectedCategoryId, search: _searchQuery);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> uploadImages(String itemId, List<String> filePaths) async {
    try {
      await _api.uploadMenuImages(itemId, filePaths);
      await loadItems(categoryId: _selectedCategoryId, search: _searchQuery);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
}
