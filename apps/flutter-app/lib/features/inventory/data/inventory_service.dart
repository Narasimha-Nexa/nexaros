import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import 'inventory_models.dart';

class InventoryService {
  final ApiClient _api;

  final _auditLog = <Map<String, dynamic>>[];

  InventoryService(this._api);

  List<Map<String, dynamic>> get auditLog => List.unmodifiable(_auditLog);

  // ─── Items ───

  Future<List<InventoryItem>> loadItems({String? branchId}) async {
    try {
      final raw = await _api.getInventoryItems();
      return raw.map((json) => InventoryItem.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('InventoryService.loadItems error: $e');
      return [];
    }
  }

  Future<InventoryItem?> createItem(Map<String, dynamic> data) async {
    try {
      final result = await _api.createInventoryItem(data);
      _addAudit('ITEM_CREATED', result['id'] ?? '', data);
      return InventoryItem.fromJson(result);
    } catch (e) {
      debugPrint('InventoryService.createItem error: $e');
      return null;
    }
  }

  Future<InventoryItem?> updateItem(String id, Map<String, dynamic> data) async {
    try {
      final result = await _api.updateInventoryItem(id, data);
      _addAudit('ITEM_UPDATED', id, data);
      return InventoryItem.fromJson(result);
    } catch (e) {
      debugPrint('InventoryService.updateItem error: $e');
      return null;
    }
  }

  Future<bool> deleteItem(String id) async {
    try {
      await _api.deleteInventoryItem(id);
      _addAudit('ITEM_DELETED', id, {});
      return true;
    } catch (e) {
      debugPrint('InventoryService.deleteItem error: $e');
      return false;
    }
  }

  // ─── Stock ───

  Future<List<InventoryItem>> loadLowStock({String? branchId}) async {
    try {
      final raw = await _api.getLowStock();
      return raw.map((json) => InventoryItem.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('InventoryService.loadLowStock error: $e');
      return [];
    }
  }

  Future<bool> adjustStock(String itemId, StockMovementType type, double quantity, {String? notes, double? unitCost}) async {
    try {
      await _api.adjustStock(itemId, {
        'type': type.name.toUpperCase(),
        'quantity': quantity,
        'notes': notes,
        if (unitCost != null) 'costPrice': unitCost,
      });
      _addAudit('STOCK_ADJUSTED', itemId, {'type': type.name, 'quantity': quantity, 'notes': notes});
      return true;
    } catch (e) {
      debugPrint('InventoryService.adjustStock error: $e');
      return false;
    }
  }

  Future<bool> receiveStock(String itemId, double quantity, {String? notes, double? unitCost, String? batchNumber}) async {
    return adjustStock(itemId, StockMovementType.receive, quantity, notes: notes, unitCost: unitCost);
  }

  Future<bool> wasteStock(String itemId, double quantity, {String? notes, WasteReason? reason}) async {
    return adjustStock(itemId, StockMovementType.waste, quantity, notes: notes);
  }

  // ─── Suppliers ───

  Future<List<Supplier>> loadSuppliers({String? tenantId}) async {
    try {
      final raw = await _api.getSuppliers();
      return raw.map((json) => Supplier.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('InventoryService.loadSuppliers error: $e');
      return [];
    }
  }

  Future<Supplier?> createSupplier(Map<String, dynamic> data) async {
    try {
      final result = await _api.createSupplier(data);
      _addAudit('SUPPLIER_CREATED', result['id'] ?? '', data);
      return Supplier.fromJson(result);
    } catch (e) {
      debugPrint('InventoryService.createSupplier error: $e');
      return null;
    }
  }

  Future<Supplier?> updateSupplier(String id, Map<String, dynamic> data) async {
    try {
      final result = await _api.updateSupplier(id, data);
      _addAudit('SUPPLIER_UPDATED', id, data);
      return Supplier.fromJson(result);
    } catch (e) {
      debugPrint('InventoryService.updateSupplier error: $e');
      return null;
    }
  }

  // ─── Purchase Orders ───

  Future<List<PurchaseOrder>> loadPurchaseOrders({String? branchId}) async {
    try {
      final raw = await _api.getPurchases();
      return raw.map((json) => PurchaseOrder.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('InventoryService.loadPurchaseOrders error: $e');
      return [];
    }
  }

  Future<PurchaseOrder?> createPurchaseOrder(Map<String, dynamic> data) async {
    try {
      final result = await _api.createPurchase(data);
      _addAudit('PO_CREATED', result['id'] ?? '', data);
      return PurchaseOrder.fromJson(result);
    } catch (e) {
      debugPrint('InventoryService.createPurchaseOrder error: $e');
      return null;
    }
  }

  Future<bool> updatePurchaseStatus(String id, PurchaseOrderStatus status) async {
    try {
      await _api.updatePurchaseStatus(id, status.name.toUpperCase());
      _addAudit('PO_STATUS_CHANGED', id, {'status': status.name});
      return true;
    } catch (e) {
      debugPrint('InventoryService.updatePurchaseStatus error: $e');
      return false;
    }
  }

  Future<bool> receivePurchaseOrder(String poId, List<Map<String, dynamic>> receivedItems) async {
    try {
      for (final item in receivedItems) {
        final itemId = item['inventoryItemId'];
        final quantity = item['quantity'] as double;
        final unitCost = item['unitPrice'] as double?;
        await adjustStock(itemId, StockMovementType.receive, quantity,
            notes: 'PO#$poId', unitCost: unitCost);
      }
      await updatePurchaseStatus(poId, PurchaseOrderStatus.received);
      _addAudit('PO_RECEIVED', poId, {'items': receivedItems.length});
      return true;
    } catch (e) {
      debugPrint('InventoryService.receivePurchaseOrder error: $e');
      return false;
    }
  }

  // ─── Dashboard ───

  Future<InventoryDashboardData> loadDashboard({String? branchId}) async {
    try {
      final items = await loadItems(branchId: branchId);
      final po = await loadPurchaseOrders(branchId: branchId);
      return InventoryDashboardData.fromItems(items, po);
    } catch (e) {
      debugPrint('InventoryService.loadDashboard error: $e');
      return const InventoryDashboardData();
    }
  }

  // ─── AI Insights ───

  List<PurchaseSuggestion> generatePurchaseSuggestions(List<InventoryItem> items) {
    final suggestions = <PurchaseSuggestion>[];

    for (final item in items) {
      if (item.needsReorder || item.isLowStock || item.isOutOfStock) {
        final urgency = item.isOutOfStock ? 'critical' : item.isLowStock ? 'high' : 'medium';
        final suggestedQty = item.reorderQuantity > 0
            ? item.reorderQuantity
            : (item.maximumStock > 0 ? item.maximumStock - item.currentStock : item.minimumStock * 2);
        final estimatedCost = suggestedQty * item.costPrice;

        suggestions.add(PurchaseSuggestion(
          itemId: item.id,
          itemName: item.name,
          currentStock: item.currentStock,
          reorderLevel: item.reorderLevel,
          suggestedQuantity: suggestedQty,
          estimatedCost: estimatedCost,
          supplierName: item.supplierName,
          urgency: urgency,
        ));
      }
    }

    suggestions.sort((a, b) {
      final urgencyOrder = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3};
      return (urgencyOrder[a.urgency] ?? 3).compareTo(urgencyOrder[b.urgency] ?? 3);
    });

    return suggestions;
  }

  List<InventoryInsight> generateInsights(List<InventoryItem> items, List<PurchaseOrder> po) {
    final insights = <InventoryInsight>[];

    final outOfStock = items.where((i) => i.isOutOfStock).length;
    final lowStock = items.where((i) => i.isLowStock && !i.isOutOfStock).length;
    final totalValue = items.fold<double>(0, (sum, i) => sum + i.stockValue);

    if (outOfStock > 0) {
      insights.add(InventoryInsight(
        title: '$outOfStock items out of stock',
        description: 'Immediate action required to avoid stockouts.',
        type: 'critical',
      ));
    }

    if (lowStock > 5) {
      insights.add(InventoryInsight(
        title: '$lowStock items running low',
        description: 'Consider placing purchase orders soon.',
        type: 'warning',
      ));
    }

    if (totalValue > 0) {
      final deadStock = items.where((i) =>
          i.currentStock > 0 && i.recentMovements.isEmpty).length;
      if (deadStock > 0) {
        insights.add(InventoryInsight(
          title: '$deadStock items with no movement',
          description: 'These items may be dead stock. Consider discounting or returning.',
          type: 'info',
        ));
      }
    }

    final pendingPo = po.where((p) => p.status.isActive).length;
    if (pendingPo > 3) {
      insights.add(InventoryInsight(
        title: '$pendingPo pending purchase orders',
        description: 'Track your open purchase orders to ensure timely delivery.',
        type: 'info',
      ));
    }

    return insights;
  }

  // ─── Filter ───

  List<InventoryItem> applyFilter(List<InventoryItem> items, InventoryFilter filter) {
    var result = items;

    if (filter.searchQuery != null && filter.searchQuery!.isNotEmpty) {
      final q = filter.searchQuery!.toLowerCase();
      result = result.where((i) =>
        i.name.toLowerCase().contains(q) ||
        (i.sku?.toLowerCase().contains(q) ?? false) ||
        (i.barcode?.toLowerCase().contains(q) ?? false) ||
        (i.category?.toLowerCase().contains(q) ?? false) ||
        (i.supplierName?.toLowerCase().contains(q) ?? false)
      ).toList();
    }

    if (filter.type != null) {
      result = result.where((i) => i.type == filter.type).toList();
    }

    if (filter.stockLevel != null) {
      result = result.where((i) => i.stockLevel == filter.stockLevel).toList();
    }

    if (filter.category != null && filter.category!.isNotEmpty) {
      result = result.where((i) => i.category == filter.category).toList();
    }

    if (filter.supplierId != null) {
      result = result.where((i) => i.supplierId == filter.supplierId).toList();
    }

    if (filter.showLowStockOnly) {
      result = result.where((i) => i.isLowStock && !i.isOutOfStock).toList();
    }

    if (filter.showOutOfStockOnly) {
      result = result.where((i) => i.isOutOfStock).toList();
    }

    return result;
  }

  // ─── Audit ───

  void _addAudit(String action, String entityId, Map<String, dynamic> data) {
    _auditLog.insert(0, {
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'action': action,
      'entityId': entityId,
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    });
    if (_auditLog.length > 500) _auditLog.removeLast();
  }
}
