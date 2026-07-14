import 'package:flutter/material.dart';
import '../network/api_client.dart';

class Branch {
  final String id;
  final String name;
  final String? address;
  final String? phone;
  final bool isPrimary;
  final bool isActive;
  final DateTime createdAt;

  Branch({
    required this.id,
    required this.name,
    this.address,
    this.phone,
    this.isPrimary = false,
    this.isActive = true,
    required this.createdAt,
  });

  factory Branch.fromJson(Map<String, dynamic> json) {
    return Branch(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      isPrimary: json['isPrimary'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String? ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'address': address,
    'phone': phone,
    'isPrimary': isPrimary,
  };

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is Branch && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}

class BranchProvider extends ChangeNotifier {
  final ApiClient _api;

  List<Branch> _branches = [];
  Branch? _selectedBranch;
  bool _isLoading = false;
  String? _error;

  List<Branch> get branches => _branches;
  Branch? get selectedBranch => _selectedBranch;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMultipleBranches => _branches.length > 1;
  String? get selectedBranchId => _selectedBranch?.id;

  BranchProvider(this._api);

  Future<void> loadBranches({bool selectDefault = true}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _api.getBranches();
      _branches = data.map((b) => Branch.fromJson(b as Map<String, dynamic>)).toList();
      _branches.sort((a, b) {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.name.compareTo(b.name);
      });

      if (selectDefault && _branches.isNotEmpty) {
        final savedBranchId = _api.branchId;
        final saved = savedBranchId != null
            ? _branches.where((b) => b.id == savedBranchId).firstOrNull
            : null;
        selectBranch(saved ?? _branches.first, persist: false);
      }
    } catch (e) {
      _error = 'Failed to load branches: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectBranch(Branch branch, {bool persist = true}) {
    if (_selectedBranch?.id == branch.id) return;
    _selectedBranch = branch;
    if (persist) {
      _api.setBranchId(branch.id);
    }
    notifyListeners();
  }

  Future<Branch> createBranch({
    required String name,
    String? address,
    String? phone,
  }) async {
    final data = await _api.createBranch({
      'name': name,
      if (address != null && address.isNotEmpty) 'address': address,
      if (phone != null && phone.isNotEmpty) 'phone': phone,
    });
    final branch = Branch.fromJson(data);
    _branches.add(branch);
    _branches.sort((a, b) {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.name.compareTo(b.name);
    });
    notifyListeners();
    return branch;
  }

  Future<void> updateBranch(String id, {String? name, String? address, String? phone}) async {
    final data = await _api.updateBranch(id, {
      if (name != null) 'name': name,
      if (address != null) 'address': address,
      if (phone != null) 'phone': phone,
    });
    final updated = Branch.fromJson(data);
    final idx = _branches.indexWhere((b) => b.id == id);
    if (idx >= 0) _branches[idx] = updated;
    if (_selectedBranch?.id == id) _selectedBranch = updated;
    notifyListeners();
  }

  Future<void> deleteBranch(String id) async {
    await _api.deleteBranch(id);
    _branches.removeWhere((b) => b.id == id);
    if (_selectedBranch?.id == id && _branches.isNotEmpty) {
      selectBranch(_branches.first);
    }
    notifyListeners();
  }

  void clear() {
    _branches = [];
    _selectedBranch = null;
    _error = null;
    notifyListeners();
  }
}
