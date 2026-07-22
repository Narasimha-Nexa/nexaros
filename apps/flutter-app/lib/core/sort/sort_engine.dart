/// Reusable enterprise sort engine with multi-column and custom sort support.
library;

import 'package:flutter/foundation.dart';

/// Sort direction
enum SortDirection { ascending, descending }

/// A single sort criterion
class SortCriterion {
  final String field;
  final SortDirection direction;
  final int priority;

  const SortCriterion({
    required this.field,
    this.direction = SortDirection.ascending,
    this.priority = 0,
  });

  SortCriterion copyWith({String? field, SortDirection? direction, int? priority}) {
    return SortCriterion(
      field: field ?? this.field,
      direction: direction ?? this.direction,
      priority: priority ?? this.priority,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is SortCriterion && field == other.field;

  @override
  int get hashCode => field.hashCode;
}

/// Reusable enterprise sort engine
class SortEngine<T> extends ChangeNotifier {
  final List<SortCriterion> _criteria = [];

  // Custom comparator functions per field
  final Map<String, int Function(dynamic, dynamic)> _customComparators = {};

  List<SortCriterion> get criteria => List.unmodifiable(_criteria);
  bool get hasActiveSort => _criteria.isNotEmpty;

  /// Register a custom comparator for a field.
  void registerComparator(String field, int Function(dynamic a, dynamic b) comparator) {
    _customComparators[field] = comparator;
  }

  /// Set single-column sort (replaces all criteria).
  void sortBy(String field, {SortDirection direction = SortDirection.ascending}) {
    _criteria.clear();
    _criteria.add(SortCriterion(field: field, direction: direction));
    notifyListeners();
  }

  /// Toggle sort direction for a field. If field is already sorted, toggle direction.
  /// If not sorted, add it as primary sort.
  void toggleSort(String field) {
    final existing = _criteria.indexWhere((c) => c.field == field);
    if (existing >= 0) {
      final current = _criteria[existing];
      if (current.direction == SortDirection.ascending) {
        _criteria[existing] = current.copyWith(direction: SortDirection.descending);
      } else {
        _criteria.removeAt(existing);
      }
    } else {
      _criteria.add(SortCriterion(field: field, direction: SortDirection.ascending));
    }
    notifyListeners();
  }

  /// Add a secondary sort criterion.
  void addSortCriterion(SortCriterion criterion) {
    _criteria.removeWhere((c) => c.field == criterion.field);
    _criteria.add(criterion);
    _criteria.sort((a, b) => a.priority.compareTo(b.priority));
    notifyListeners();
  }

  /// Clear all sort criteria.
  void clearSort() {
    _criteria.clear();
    notifyListeners();
  }

  /// Get current sort direction for a field, or null if not sorted.
  SortDirection? getDirectionFor(String field) {
    try {
      return _criteria.firstWhere((c) => c.field == field).direction;
    } catch (_) {
      return null;
    }
  }

  /// Sort a list of items according to active criteria.
  List<T> sortItems(List<T> items) {
    if (_criteria.isEmpty) return items;

    final sorted = List<T>.from(items);
    sorted.sort((a, b) {
      for (final criterion in _criteria) {
        final comparison = _compareItems(a, b, criterion);
        if (comparison != 0) {
          return criterion.direction == SortDirection.ascending
              ? comparison
              : -comparison;
        }
      }
      return 0;
    });

    return sorted;
  }

  int _compareItems(T a, T b, SortCriterion criterion) {
    // Use custom comparator if registered
    if (_customComparators.containsKey(criterion.field)) {
      return _customComparators[criterion.field]!(a, b);
    }

    // Default comparison via Map<String, dynamic> or toString
    dynamic valueA, valueB;

    if (a is Map<String, dynamic>) {
      valueA = a[criterion.field];
    } else {
      try {
        valueA = (a as dynamic).toJson()[criterion.field];
      } catch (_) {
        valueA = a.toString();
      }
    }

    if (b is Map<String, dynamic>) {
      valueB = b[criterion.field];
    } else {
      try {
        valueB = (b as dynamic).toJson()[criterion.field];
      } catch (_) {
        valueB = b.toString();
      }
    }

    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return -1;
    if (valueB == null) return 1;

    if (valueA is Comparable && valueB is Comparable) {
      return valueA.compareTo(valueB);
    }

    return valueA.toString().compareTo(valueB.toString());
  }
}
