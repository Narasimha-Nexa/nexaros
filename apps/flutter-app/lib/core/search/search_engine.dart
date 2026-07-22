/// Reusable enterprise search engine with debounce, suggestions, recent searches.
///
/// Usage:
/// ```dart
/// final engine = SearchEngine<String>(
///   onSearch: (query) => api.searchItems(query),
///   debounceMs: 300,
///   maxRecent: 20,
/// );
///
/// // In widget:
/// engine.search('pizza'); // triggers debounced search
/// engine.recentSearches; // List<String>
/// engine.clearRecent();
/// ```
library;

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Search state enum
enum SearchState { idle, loading, loaded, error }

/// Search result wrapper
class SearchResult<T> {
  final List<T> items;
  final String query;
  final int total;
  final bool hasMore;
  final DateTime timestamp;
  final Duration duration;

  const SearchResult({
    required this.items,
    required this.query,
    required this.total,
    this.hasMore = false,
    required this.timestamp,
    required this.duration,
  });

  SearchResult.empty(String query)
      : items = const [],
        query = query,
        total = 0,
        hasMore = false,
        timestamp = DateTime.now(),
        duration = Duration.zero;
}

/// Reusable search engine with debounce, suggestions, and recent searches.
class SearchEngine<T> extends ChangeNotifier {
  final Future<List<T>> Function(String query)? onSearch;
  final Future<List<String>> Function(String query)? onSuggestions;
  final int debounceMs;
  final int maxRecent;
  final String storageKey;

  SearchEngine({
    this.onSearch,
    this.onSuggestions,
    this.debounceMs = 300,
    this.maxRecent = 20,
    this.storageKey = 'search_recent',
  });

  // State
  SearchState _state = SearchState.idle;
  SearchResult<T>? _result;
  String _query = '';
  String? _error;
  List<String> _recentSearches = [];
  List<String> _suggestions = [];
  Timer? _debounceTimer;

  // Getters
  SearchState get state => _state;
  SearchResult<T>? get result => _result;
  String get query => _query;
  String? get error => _error;
  List<String> get recentSearches => List.unmodifiable(_recentSearches);
  List<String> get suggestions => List.unmodifiable(_suggestions);
  bool get isSearching => _state == SearchState.loading;
  bool get hasResults => _result != null && _result!.items.isNotEmpty;

  /// Initialize — load recent searches from storage.
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _recentSearches = prefs.getStringList(storageKey) ?? [];
    notifyListeners();
  }

  /// Search with debounce. Call on every keystroke.
  void search(String query) {
    _query = query;
    _debounceTimer?.cancel();

    if (query.trim().isEmpty) {
      _state = SearchState.idle;
      _result = null;
      _error = null;
      _suggestions = [];
      notifyListeners();
      return;
    }

    // Fetch suggestions immediately (no debounce)
    _fetchSuggestions(query);

    // Debounced actual search
    _debounceTimer = Timer(Duration(milliseconds: debounceMs), () {
      _performSearch(query);
    });
  }

  /// Search immediately (bypass debounce).
  Future<void> searchImmediate(String query) async {
    _query = query;
    _debounceTimer?.cancel();
    await _performSearch(query);
  }

  /// Load more results (pagination).
  Future<void> loadMore() async {
    if (_result == null || !_result!.hasMore || _state == SearchState.loading) return;
    notifyListeners();
  }

  /// Clear current search and results.
  void clear() {
    _query = '';
    _result = null;
    _error = null;
    _suggestions = [];
    _state = SearchState.idle;
    _debounceTimer?.cancel();
    notifyListeners();
  }

  /// Clear recent searches.
  Future<void> clearRecent() async {
    _recentSearches.clear();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(storageKey);
    notifyListeners();
  }

  /// Remove a specific recent search.
  Future<void> removeRecent(String query) async {
    _recentSearches.remove(query);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(storageKey, _recentSearches);
    notifyListeners();
  }

  Future<void> _performSearch(String query) async {
    if (onSearch == null) return;

    _state = SearchState.loading;
    _error = null;
    notifyListeners();

    final stopwatch = Stopwatch()..start();

    try {
      final results = await onSearch!(query);
      stopwatch.stop();

      _result = SearchResult<T>(
        items: results,
        query: query,
        total: results.length,
        timestamp: DateTime.now(),
        duration: stopwatch.elapsed,
      );
      _state = SearchState.loaded;

      // Save to recent searches
      _addToRecent(query);
    } catch (e) {
      _error = e.toString();
      _state = SearchState.error;
    }

    notifyListeners();
  }

  Future<void> _fetchSuggestions(String query) async {
    if (onSuggestions == null) return;

    try {
      final results = await onSuggestions!(query);
      _suggestions = results;
      notifyListeners();
    } catch (_) {
      // Suggestions are best-effort
    }
  }

  Future<void> _addToRecent(String query) async {
    _recentSearches.remove(query);
    _recentSearches.insert(0, query);
    if (_recentSearches.length > maxRecent) {
      _recentSearches = _recentSearches.sublist(0, maxRecent);
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(storageKey, _recentSearches);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }
}

/// Mixin for searchable states — adds search + filter + sort capabilities to any ChangeNotifier.
mixin SearchableState<T> on ChangeNotifier {
  final SearchEngine<T> searchEngine = SearchEngine<T>();

  List<T> _allItems = [];
  List<T> _filteredItems = [];

  List<T> get allItems => _allItems;
  List<T> get filteredItems => _filteredItems;

  set allItems(List<T> value) {
    _allItems = value;
    _applyFilters();
  }

  void _applyFilters() {
    final query = searchEngine.query.toLowerCase();
    if (query.isEmpty) {
      _filteredItems = List.from(_allItems);
    } else {
      _filteredItems = _allItems.where((item) {
        return item.toString().toLowerCase().contains(query);
      }).toList();
    }
    notifyListeners();
  }
}
