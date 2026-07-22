import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';

class FaqScreen extends StatelessWidget {
  const FaqScreen({super.key});

  static const _faqs = [
    _Faq('Getting Started', 'How do I set up my restaurant?', 'Navigate to Settings > Restaurant Profile to add your restaurant details, then go to Branches to create your first branch. Add menu items from the Menu section.'),
    _Faq('Getting Started', 'How do I add menu items?', 'Go to Menu > Add Item. Fill in the name, description, price, and category. You can also add images, variants (size/portions), and add-ons.'),
    _Faq('Orders', 'How do I create an order?', 'From the POS screen, select a table or start a takeaway order. Add items from the menu, apply discounts if needed, and proceed to checkout.'),
    _Faq('Orders', 'How do I cancel an order?', 'Open the order detail screen and tap the Cancel button. Only orders in Pending or Confirmed status can be cancelled.'),
    _Faq('Payments', 'What payment methods are supported?', 'We support Cash, UPI, Credit Card, Debit Card, Net Banking, and Online payments. Configure available methods in Settings.'),
    _Faq('Inventory', 'How do I track inventory?', 'Go to Inventory to add items with stock quantities. Enable low-stock alerts to get notified when items run low. Use Adjustments to record stock changes.'),
    _Faq('Staff', 'How do I manage staff attendance?', 'Staff can clock in/out from the Attendance section. Managers can view attendance reports and manage shifts from the Staff module.'),
    _Faq('Finance', 'Where can I see my financial reports?', 'Navigate to Finance > Reports for P&L statements, income analysis, and expense breakdowns. The Finance Dashboard shows a quick overview.'),
    _Faq('Billing', 'How do I upgrade my plan?', 'Go to Settings > Subscription to view available plans. Select a plan and complete the payment to upgrade immediately.'),
    _Faq('Technical', 'Does the app work offline?', 'Yes! The app has offline-first architecture. Orders, POS, and kitchen operations work offline and sync automatically when connectivity returns.'),
  ];

  @override
  Widget build(BuildContext context) {
    final categories = _faqs.map((f) => f.category).toSet().toList();

    return Scaffold(
      appBar: AppBar(title: Text('FAQ', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: categories.length,
        itemBuilder: (ctx, i) {
          final cat = categories[i];
          final items = _faqs.where((f) => f.category == cat).toList();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(cat, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
              const SizedBox(height: 8),
              ...items.map((faq) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ExpansionTile(
                  tilePadding: const EdgeInsets.symmetric(horizontal: 16),
                  title: Text(faq.question, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
                  children: [Padding(padding: const EdgeInsets.all(16), child: Text(faq.answer, style: GoogleFonts.inter(fontSize: 13, color: AppColors.gray600)))],
                ),
              )),
              const SizedBox(height: 12),
            ],
          );
        },
      ),
    );
  }
}

class _Faq {
  final String category;
  final String question;
  final String answer;
  const _Faq(this.category, this.question, this.answer);
}
