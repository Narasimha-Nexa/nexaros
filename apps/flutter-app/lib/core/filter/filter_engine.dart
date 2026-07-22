/// Reusable enterprise filter engine with saved filters, date/branch/status/category support.
library;

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Filter operator types
enum FilterOperator {
  equals,
  notEquals,
  contains,
  greaterThan,
  lessThan,
  between,
  inList,
  isNull,
  isNotNull,
}

/// A single filter condition
class FilterCondition {
  final String field;
  final FilterOperator operator;
  final dynamic value;
  final dynamic secondValue;

  const FilterCondition({
    required this.field,
    required this.operator,
    required this.value,
    this.secondValue,
  });

  Map<String, dynamic> toJson() => {
        'field': field,
        'operator': operator.name,
        'value': value?.toString(),
        'secondValue': secondValue?.toString(),
      };

  factory FilterCondition.fromJson(Map<String, dynamic> json) =>
      FilterCondition(
        field: json['field'] as String,
        operator: FilterOperator.values
            .firstWhere((e) => e.name == json['operator']),
        value: json['value'],
        secondValue: json['secondValue'],
      );

  /// Evaluate this condition against a record
  bool evaluate(dynamic record) {
    if (record is! Map<String, dynamic>) return false;
    final fieldValue = record[field];

    switch (operator) {
      case FilterOperator.equals:
        return fieldValue?.toString() == value?.toString();
      case FilterOperator.notEquals:
        return fieldValue?.toString() != value?.toString();
      case FilterOperator.contains:
        return fieldValue
                ?.toString()
                .toLowerCase()
                .contains(value?.toString().toLowerCase() ?? '') ??
            false;
      case FilterOperator.greaterThan:
        return (fieldValue as Comparable).compareTo(value) > 0;
      case FilterOperator.lessThan:
        return (fieldValue as Comparable).compareTo(value) < 0;
      case FilterOperator.between:
        final min = value;
        final max = secondValue;
        return (fieldValue as Comparable).compareTo(min) >= 0 &&
            (fieldValue as Comparable).compareTo(max) <= 0;
      case FilterOperator.inList:
        return value is List &&
            value.map((e) => e.toString()).contains(fieldValue?.toString());
      case FilterOperator.isNull:
        return fieldValue == null;
      case FilterOperator.isNotNull:
        return fieldValue != null;
    }
  }

  @override
  String toString() => '$field ${operator.name} $value';
}

/// A saved filter preset
class FilterPreset {
  final String id;
  final String name;
  final List<FilterCondition> conditions;
  final DateTime createdAt;

  const FilterPreset({
    required this.id,
    required this.name,
    required this.conditions,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'conditions': conditions.map((c) => c.toJson()).toList(),
        'createdAt': createdAt.toIso8601String(),
      };

  factory FilterPreset.fromJson(Map<String, dynamic> json) => FilterPreset(
        id: json['id'] as String,
        name: json['name'] as String,
        conditions: (json['conditions'] as List)
            .map((c) => FilterCondition.fromJson(c as Map<String, dynamic>))
            .toList(),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

/// Reusable enterprise filter engine
class FilterEngine<T> extends ChangeNotifier {
  final List<FilterCondition> _activeFilters = [];
  List<FilterPreset> _savedPresets = [];
  final String storageKey;

  FilterEngine({this.storageKey = 'filter_presets'});

  List<FilterCondition> get activeFilters => List.unmodifiable(_activeFilters);
  List<FilterPreset> get savedPresets => List.unmodifiable(_savedPresets);
  bool get hasActiveFilters => _activeFilters.isNotEmpty;

  /// Initialize — load saved presets from storage.
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(storageKey);
    if (data != null) {
      final list = jsonDecode(data) as List;
      _savedPresets = list
          .map((e) => FilterPreset.fromJson(e as Map<String, dynamic>))
          .toList();
      notifyListeners();
    }
  }

  /// Add a filter condition.
  void addFilter(FilterCondition condition) {
    _activeFilters.removeWhere((f) => f.field == condition.field);
    _activeFilters.add(condition);
    notifyListeners();
  }

  /// Remove a filter by field name.
  void removeFilter(String field) {
    _activeFilters.removeWhere((f) => f.field == field);
    notifyListeners();
  }

  /// Clear all active filters.
  void clearFilters() {
    _activeFilters.clear();
    notifyListeners();
  }

  /// Apply filters to a list of records (Map<String, dynamic>).
  List<T> applyFilters(List<T> items) {
    if (_activeFilters.isEmpty) return items;

    return items.where((item) {
      return _activeFilters.every((filter) {
        if (item is Map<String, dynamic>) {
          return filter.evaluate(item);
        }
        return true;
      });
    }).toList();
  }

  /// Save current filters as a preset.
  Future<void> saveAsPreset(String name) async {
    final preset = FilterPreset(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      conditions: List.from(_activeFilters),
      createdAt: DateTime.now(),
    );
    _savedPresets.add(preset);
    await _persistPresets();
    notifyListeners();
  }

  /// Load a saved preset as active filters.
  void loadPreset(String presetId) {
    final preset = _savedPresets.firstWhere((p) => p.id == presetId);
    _activeFilters.clear();
    _activeFilters.addAll(preset.conditions);
    notifyListeners();
  }

  /// Delete a saved preset.
  Future<void> deletePreset(String presetId) async {
    _savedPresets.removeWhere((p) => p.id == presetId);
    await _persistPresets();
    notifyListeners();
  }

  Future<void> _persistPresets() async {
    final prefs = await SharedPreferences.getInstance();
    final data = jsonEncode(_savedPresets.map((p) => p.toJson()).toList());
    await prefs.setString(storageKey, data);
  }
}
