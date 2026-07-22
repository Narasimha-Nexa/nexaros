import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nexaros_app/features/pos/data/pos_models.dart';

void main() {
  group('PosModels Tests', () {
    group('CartItemModifier', () {
      test('creates with required fields', () {
        const modifier = CartItemModifier(
          id: 'mod1',
          name: 'Extra Cheese',
          price: 1.50,
          isSelected: true,
        );

        expect(modifier.id, 'mod1');
        expect(modifier.name, 'Extra Cheese');
        expect(modifier.price, 1.50);
        expect(modifier.isSelected, true);
      });

      test('copyWith changes isSelected', () {
        const modifier = CartItemModifier(
          id: 'mod1',
          name: 'Extra Cheese',
          price: 1.50,
          isSelected: true,
        );

        final copy = modifier.copyWith(isSelected: false);

        expect(copy.id, 'mod1');
        expect(copy.isSelected, false);
      });

      test('toJson and fromJson roundtrip', () {
        const modifier = CartItemModifier(
          id: 'mod1',
          name: 'Extra Cheese',
          price: 1.50,
          isSelected: true,
        );

        final json = modifier.toJson();
        final restored = CartItemModifier.fromJson(json);

        expect(restored.id, modifier.id);
        expect(restored.name, modifier.name);
        expect(restored.price, modifier.price);
        expect(restored.isSelected, modifier.isSelected);
      });
    });

    group('CartItem', () {
      test('creates with required fields', () {
        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Margherita Pizza',
          quantity: 2,
          unitPrice: 12.99,
          isVeg: true,
        );

        expect(item.id, 'item1');
        expect(item.menuItemId, 'menu1');
        expect(item.name, 'Margherita Pizza');
        expect(item.quantity, 2);
        expect(item.unitPrice, 12.99);
        expect(item.isVeg, true);
        expect(item.isVoided, false);
        expect(item.modifiers, isEmpty);
        expect(item.addOns, isEmpty);
      });

      test('lineTotal calculates correctly', () {
        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Margherita Pizza',
          quantity: 2,
          unitPrice: 12.99,
        );

        // lineTotal = (unitPrice + modifierTotal + addOnTotal) * quantity
        // = (12.99 + 0 + 0) * 2 = 25.98
        expect(item.lineTotal, 25.98);
      });

      test('modifierTotal calculates correctly (sum of selected, not multiplied by quantity)', () {
        final modifier1 = CartItemModifier(id: 'm1', name: 'Extra Cheese', price: 1.50);
        final modifier2 = CartItemModifier(id: 'm2', name: 'Extra Sauce', price: 0.75, isSelected: false);

        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Margherita Pizza',
          quantity: 2,
          unitPrice: 12.99,
          modifiers: [modifier1, modifier2],
        );

        // modifierTotal = sum of selected modifier prices = 1.50 (NOT multiplied by quantity)
        expect(item.modifierTotal, 1.50);
      });

      test('addOnTotal calculates correctly (sum of selected, not multiplied by quantity)', () {
        final addOn1 = CartItemModifier(id: 'a1', name: 'Garlic Bread', price: 3.00);
        final addOn2 = CartItemModifier(id: 'a2', name: 'Drink', price: 2.00, isSelected: false);

        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Margherita Pizza',
          quantity: 2,
          unitPrice: 12.99,
          addOns: [addOn1, addOn2],
        );

        // addOnTotal = sum of selected addOn prices = 3.00 (NOT multiplied by quantity)
        expect(item.addOnTotal, 3.00);
      });

      test('toJson and fromJson roundtrip', () {
        final modifier = CartItemModifier(id: 'm1', name: 'Extra Cheese', price: 1.50);
        final addOn = CartItemModifier(id: 'a1', name: 'Garlic Bread', price: 3.00);

        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Margherita Pizza',
          quantity: 2,
          unitPrice: 12.99,
          isVeg: true,
          modifiers: [modifier],
          addOns: [addOn],
          notes: 'Well done',
          course: 'Main',
        );

        final json = item.toJson();
        final restored = CartItem.fromJson(json);

        expect(restored.id, item.id);
        expect(restored.menuItemId, item.menuItemId);
        expect(restored.name, item.name);
        expect(restored.quantity, item.quantity);
        expect(restored.unitPrice, item.unitPrice);
        expect(restored.isVeg, item.isVeg);
        expect(restored.notes, item.notes);
        expect(restored.course, item.course);
        expect(restored.modifiers.length, 1);
        expect(restored.addOns.length, 1);
        expect(restored.isVoided, false);
      });
    });

    group('Cart', () {
      test('creates empty cart', () {
        final cart = Cart(id: 'cart1');

        expect(cart.id, 'cart1');
        expect(cart.items, isEmpty);
        expect(cart.isEmpty, true);
        expect(cart.itemCount, 0);
        expect(cart.subtotal, 0.0);
      });

      test('addItem adds new item', () {
        final cart = Cart(id: 'cart1');
        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 1,
          unitPrice: 10.00,
        );

        cart.addItem(item);

        expect(cart.items.length, 1);
        expect(cart.items.first.id, 'item1');
        expect(cart.itemCount, 1);
        expect(cart.subtotal, 10.00);
      });

      test('addItem merges identical items', () {
        final cart = Cart(id: 'cart1');
        final item1 = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 1,
          unitPrice: 10.00,
        );
        final item2 = CartItem(
          id: 'item2',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 2,
          unitPrice: 10.00,
        );

        cart.addItem(item1);
        cart.addItem(item2);

        expect(cart.items.length, 1);
        expect(cart.items.first.quantity, 3);
        expect(cart.itemCount, 3);
        expect(cart.subtotal, 30.00);
      });

      test('addItem does not merge items with different modifiers', () {
        final cart = Cart(id: 'cart1');
        final modifier = CartItemModifier(id: 'm1', name: 'Extra Cheese', price: 1.00);
        final item1 = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 1,
          unitPrice: 10.00,
          modifiers: [modifier],
        );
        final item2 = CartItem(
          id: 'item2',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 1,
          unitPrice: 10.00,
        );

        cart.addItem(item1);
        cart.addItem(item2);

        expect(cart.items.length, 2);
      });

      test('removeItem removes item by id', () {
        final cart = Cart(id: 'cart1');
        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 2,
          unitPrice: 10.00,
        );

        cart.addItem(item);
        cart.removeItem('item1');

        expect(cart.items, isEmpty);
        expect(cart.isEmpty, true);
      });

      test('updateQuantity updates quantity', () {
        final cart = Cart(id: 'cart1');
        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 1,
          unitPrice: 10.00,
        );

        cart.addItem(item);
        cart.updateQuantity('item1', 5);

        expect(cart.items.first.quantity, 5);
        expect(cart.itemCount, 5);
      });

      test('updateQuantity with zero removes item', () {
        final cart = Cart(id: 'cart1');
        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 1,
          unitPrice: 10.00,
        );

        cart.addItem(item);
        cart.updateQuantity('item1', 0);

        expect(cart.items, isEmpty);
      });

      test('voidItem marks item as voided', () {
        final cart = Cart(id: 'cart1');
        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 2,
          unitPrice: 10.00,
        );

        cart.addItem(item);
        cart.voidItem('item1');

        expect(cart.items.first.isVoided, true);
        expect(cart.activeItems, isEmpty);
        expect(cart.isEmpty, true);
        expect(cart.subtotal, 0.0);
      });

      test('clear removes all items', () {
        final cart = Cart(id: 'cart1');
        final item1 = CartItem(id: 'i1', menuItemId: 'm1', name: 'Pizza', quantity: 1, unitPrice: 10.00);
        final item2 = CartItem(id: 'i2', menuItemId: 'm2', name: 'Burger', quantity: 1, unitPrice: 8.00);

        cart.addItem(item1);
        cart.addItem(item2);
        cart.clear();

        expect(cart.items, isEmpty);
        expect(cart.isEmpty, true);
      });

      test('toJson and fromJson roundtrip', () {
        final cart = Cart(id: 'cart1', tableId: 'table1', tableNumber: 'Table 5', guestCount: 4);
        final item = CartItem(
          id: 'item1',
          menuItemId: 'menu1',
          name: 'Pizza',
          quantity: 2,
          unitPrice: 12.00,
          isVeg: true,
        );

        cart.addItem(item);

        final json = cart.toJson();
        final restored = Cart.fromJson(json);

        expect(restored.id, cart.id);
        expect(restored.tableId, cart.tableId);
        expect(restored.tableNumber, cart.tableNumber);
        expect(restored.guestCount, cart.guestCount);
        expect(restored.items.length, 1);
        expect(restored.items.first.name, 'Pizza');
        expect(restored.items.first.quantity, 2);
      });
    });

    group('HeldOrder', () {
      test('creates with required fields', () {
        final cart = Cart(id: 'cart1');
        final held = HeldOrder(
          id: 'held1',
          cart: cart,
          staffName: 'John',
          heldAt: DateTime(2024, 1, 15, 12, 30),
          reason: 'Customer stepped away',
        );

        expect(held.id, 'held1');
        expect(held.cart.id, 'cart1');
        expect(held.staffName, 'John');
        expect(held.reason, 'Customer stepped away');
      });
    });

    group('PaymentEntry', () {
      test('creates with required fields', () {
        final entry = PaymentEntry(
          id: 'pay1',
          method: PosPaymentMethod.cash,
          amount: 25.00,
          reference: 'CASH-001',
        );

        expect(entry.id, 'pay1');
        expect(entry.method, PosPaymentMethod.cash);
        expect(entry.amount, 25.00);
        expect(entry.reference, 'CASH-001');
      });

      test('toJson serializes correctly', () {
        final entry = PaymentEntry(
          id: 'pay1',
          method: PosPaymentMethod.creditCard,
          amount: 50.00,
          reference: 'TXN-123',
        );

        final json = entry.toJson();

        expect(json['id'], 'pay1');
        expect(json['method'], 'creditCard');
        expect(json['amount'], 50.00);
        expect(json['reference'], 'TXN-123');
      });
    });

    group('PaymentBreakdown', () {
      test('amountPaid and amountDue computed correctly', () {
        final billing = PaymentBreakdown(
          subtotal: 100.00,
          taxAmount: 10.00,
          totalAmount: 110.00,
          payments: [
            PaymentEntry(id: 'p1', method: PosPaymentMethod.cash, amount: 60.00),
            PaymentEntry(id: 'p2', method: PosPaymentMethod.creditCard, amount: 60.00),
          ],
          amountPaid: 120.00,
          amountDue: -10.00, // Overpaid
          changeAmount: 10.00,
        );

        expect(billing.amountPaid, 120.00);
        expect(billing.amountDue, -10.00);
        expect(billing.changeAmount, 10.00);
        expect(billing.isFullyPaid, true);
      });

      test('amountDue is positive when underpaid', () {
        final billing = PaymentBreakdown(
          subtotal: 100.00,
          taxAmount: 10.00,
          totalAmount: 110.00,
          payments: [
            PaymentEntry(id: 'p1', method: PosPaymentMethod.cash, amount: 50.00),
          ],
          amountPaid: 50.00,
          amountDue: 60.00,
          changeAmount: 0.00,
        );

        expect(billing.amountPaid, 50.00);
        expect(billing.amountDue, 60.00);
        expect(billing.changeAmount, 0.00);
        expect(billing.isFullyPaid, false);
      });
    });

    group('PosPaymentMethod', () {
      test('all methods have label, icon, and color', () {
        for (final method in PosPaymentMethod.values) {
          expect(method.label, isNotEmpty);
          expect(method.icon, isNotNull);
          expect(method.color, isNotNull);
        }
      });

      test('cash method has correct properties', () {
        expect(PosPaymentMethod.cash.label, 'Cash');
        expect(PosPaymentMethod.cash.icon, Icons.money);
      });

      test('split method has correct properties', () {
        expect(PosPaymentMethod.split.label, 'Split Payment');
        expect(PosPaymentMethod.split.icon, Icons.call_split);
      });
    });

    group('RefundReason', () {
      test('all reasons have labels', () {
        for (final reason in RefundReason.values) {
          expect(reason.label, isNotEmpty);
        }
      });

      test('customerRequest has correct label', () {
        expect(RefundReason.customerRequest.label, 'Customer Request');
      });
    });

    group('PosTaxConfig', () {
      test('default values are correct', () {
        const config = PosTaxConfig();

        expect(config.gstRate, 5.0);
        expect(config.splitGst, true);
        expect(config.serviceChargeRate, 0);
        expect(config.enableServiceCharge, false);
        expect(config.enableRoundOff, true);
      });

      test('custom values are set', () {
        const config = PosTaxConfig(
          gstRate: 18.0,
          splitGst: true,
          serviceChargeRate: 10.0,
          enableServiceCharge: true,
          enableRoundOff: false,
        );

        expect(config.gstRate, 18.0);
        expect(config.splitGst, true);
        expect(config.serviceChargeRate, 10.0);
        expect(config.enableServiceCharge, true);
        expect(config.enableRoundOff, false);
      });
    });

    group('PosReceiptConfig', () {
      test('required fields', () {
        const config = PosReceiptConfig(restaurantName: 'Test', branchName: 'Branch');

        expect(config.restaurantName, 'Test');
        expect(config.branchName, 'Branch');
        expect(config.gstNumber, isNull);
        expect(config.address, isNull);
        expect(config.footerMessage, isNull);
        expect(config.showItemDetails, true);
        expect(config.showTaxBreakdown, true);
        expect(config.showPaymentMethod, true);
        expect(config.showQrCode, false);
      });
    });

    group('PosDiscountConfig', () {
      test('default values', () {
        const config = PosDiscountConfig();

        expect(config.enablePercentage, true);
        expect(config.enableFixed, true);
        expect(config.enableCoupon, true);
        expect(config.percentagePresets, [5, 10, 15, 20, 25, 50]);
        expect(config.maxDiscountPercent, 50);
        expect(config.maxDiscountAmount, 10000);
      });
    });

    group('PosUpsellSuggestion', () {
      test('creates with required fields', () {
        const suggestion = PosUpsellSuggestion(
          id: 'upsell1',
          name: 'Garlic Bread',
          price: 4.99,
          reason: 'complementary',
          confidence: 0.85,
        );

        expect(suggestion.id, 'upsell1');
        expect(suggestion.name, 'Garlic Bread');
        expect(suggestion.price, 4.99);
        expect(suggestion.reason, 'complementary');
        expect(suggestion.confidence, 0.85);
      });
    });

    group('PosAuditEntry', () {
      test('creates with required fields', () {
        final entry = PosAuditEntry(
          id: 'audit1',
          action: 'ADD_ITEM',
          entityType: 'cart_item',
          entityId: 'item1',
          staffId: 'staff1',
          staffName: 'John',
          timestamp: DateTime.now(),
        );

        expect(entry.action, 'ADD_ITEM');
        expect(entry.entityType, 'cart_item');
        expect(entry.entityId, 'item1');
        expect(entry.staffId, 'staff1');
        expect(entry.staffName, 'John');
      });
    });
  });
}