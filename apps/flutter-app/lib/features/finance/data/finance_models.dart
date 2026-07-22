import 'package:flutter/material.dart';

// ── Enums ──────────────────────────────────────────────────────────────────

enum TransactionType { income, expense, transfer, refund, adjustment }

enum PaymentMethod { cash, card, upi, googlePay, phonePe, paytm, wallet, giftCard, bankTransfer, split, other }

enum InvoiceType { sales, purchase, creditNote, debitNote, proforma, recurring }

enum InvoiceStatus { draft, sent, paid, partiallyPaid, overdue, cancelled, void_ }

enum SettlementStatus { pending, processing, completed, failed, reconciled }

enum AccountType { asset, liability, equity, revenue, expense }

enum JournalEntryType { standard, adjusting, closing, reversing, payroll }

enum ExpenseCategory { foodSupplies, beverages, utilities, rent, salary, marketing, maintenance, repairs, transportation, equipment, packaging, delivery, other }

enum IncomeCategory { dineIn, takeaway, delivery, onlineOrder, catering, subscription, giftCard, other }

enum BudgetStatus { draft, active, completed, exceeded }

enum TaxType { cgst, sgst, igst, cess, tds }

enum ReconciliationStatus { pending, inProgress, completed, discrepancy }

enum SettlementProvider { razorpay, stripe, phonePe, cashfree, paytm, other }

enum ForecastType { revenue, expense, profit, cashFlow, inventoryCost, laborCost }

enum AccountEntrySide { debit, credit }

// ── Finance Overview ───────────────────────────────────────────────────────

class FinanceOverview {
  final double todayRevenue;
  final double monthlyRevenue;
  final double yearlyRevenue;
  final double netProfit;
  final double grossProfit;
  final double operatingProfit;
  final double cashBalance;
  final double bankBalance;
  final double outstandingReceivables;
  final double outstandingPayables;
  final double pendingSettlements;
  final double taxesDue;
  final double foodCost;
  final double laborCost;
  final double operatingExpenses;
  final double cashFlow;
  final double businessHealthScore;

  const FinanceOverview({
    this.todayRevenue = 0,
    this.monthlyRevenue = 0,
    this.yearlyRevenue = 0,
    this.netProfit = 0,
    this.grossProfit = 0,
    this.operatingProfit = 0,
    this.cashBalance = 0,
    this.bankBalance = 0,
    this.outstandingReceivables = 0,
    this.outstandingPayables = 0,
    this.pendingSettlements = 0,
    this.taxesDue = 0,
    this.foodCost = 0,
    this.laborCost = 0,
    this.operatingExpenses = 0,
    this.cashFlow = 0,
    this.businessHealthScore = 0,
  });

  double get profitMargin => monthlyRevenue > 0 ? (netProfit / monthlyRevenue * 100) : 0;
  double get foodCostPercent => monthlyRevenue > 0 ? (foodCost / monthlyRevenue * 100) : 0;
  double get laborCostPercent => monthlyRevenue > 0 ? (laborCost / monthlyRevenue * 100) : 0;

  factory FinanceOverview.fromJson(Map<String, dynamic> json) => FinanceOverview(
    todayRevenue: (json['todayRevenue'] ?? 0).toDouble(),
    monthlyRevenue: (json['monthlyRevenue'] ?? 0).toDouble(),
    yearlyRevenue: (json['yearlyRevenue'] ?? 0).toDouble(),
    netProfit: (json['netProfit'] ?? 0).toDouble(),
    grossProfit: (json['grossProfit'] ?? 0).toDouble(),
    operatingProfit: (json['operatingProfit'] ?? 0).toDouble(),
    cashBalance: (json['cashBalance'] ?? 0).toDouble(),
    bankBalance: (json['bankBalance'] ?? 0).toDouble(),
    outstandingReceivables: (json['outstandingReceivables'] ?? 0).toDouble(),
    outstandingPayables: (json['outstandingPayables'] ?? 0).toDouble(),
    pendingSettlements: (json['pendingSettlements'] ?? 0).toDouble(),
    taxesDue: (json['taxesDue'] ?? 0).toDouble(),
    foodCost: (json['foodCost'] ?? 0).toDouble(),
    laborCost: (json['laborCost'] ?? 0).toDouble(),
    operatingExpenses: (json['operatingExpenses'] ?? 0).toDouble(),
    cashFlow: (json['cashFlow'] ?? 0).toDouble(),
    businessHealthScore: (json['businessHealthScore'] ?? 0).toDouble(),
  );
}

// ── Income Entry ───────────────────────────────────────────────────────────

class IncomeEntry {
  final String id;
  final String? description;
  final double amount;
  final DateTime date;
  final IncomeCategory category;
  final PaymentMethod paymentMethod;
  final String? orderId;
  final String? branchId;
  final String? notes;
  final String? createdBy;
  final DateTime createdAt;

  const IncomeEntry({
    required this.id,
    this.description,
    required this.amount,
    required this.date,
    this.category = IncomeCategory.other,
    this.paymentMethod = PaymentMethod.cash,
    this.orderId,
    this.branchId,
    this.notes,
    this.createdBy,
    required this.createdAt,
  });

  factory IncomeEntry.fromJson(Map<String, dynamic> json) => IncomeEntry(
    id: json['id'] ?? '',
    description: json['description'],
    amount: (json['amount'] ?? 0).toDouble(),
    date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
    category: IncomeCategory.values.firstWhere((c) => c.name == json['category'], orElse: () => IncomeCategory.other),
    paymentMethod: PaymentMethod.values.firstWhere((p) => p.name == json['paymentMethod'], orElse: () => PaymentMethod.cash),
    orderId: json['orderId'],
    branchId: json['branchId'],
    notes: json['notes'],
    createdBy: json['createdBy'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Expense Entry ──────────────────────────────────────────────────────────

class ExpenseEntry {
  final String id;
  final String? description;
  final double amount;
  final DateTime date;
  final ExpenseCategory category;
  final PaymentMethod paymentMethod;
  final String? vendor;
  final String? supplierId;
  final String? branchId;
  final String? notes;
  final String? attachmentUrl;
  final bool isRecurring;
  final String? recurringPattern;
  final String? createdBy;
  final DateTime createdAt;

  const ExpenseEntry({
    required this.id,
    this.description,
    required this.amount,
    required this.date,
    this.category = ExpenseCategory.other,
    this.paymentMethod = PaymentMethod.cash,
    this.vendor,
    this.supplierId,
    this.branchId,
    this.notes,
    this.attachmentUrl,
    this.isRecurring = false,
    this.recurringPattern,
    this.createdBy,
    required this.createdAt,
  });

  factory ExpenseEntry.fromJson(Map<String, dynamic> json) => ExpenseEntry(
    id: json['id'] ?? '',
    description: json['description'],
    amount: (json['amount'] ?? 0).toDouble(),
    date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
    category: ExpenseCategory.values.firstWhere((c) => c.name == json['category'], orElse: () => ExpenseCategory.other),
    paymentMethod: PaymentMethod.values.firstWhere((p) => p.name == json['paymentMethod'], orElse: () => PaymentMethod.cash),
    vendor: json['vendor'],
    supplierId: json['supplierId'],
    branchId: json['branchId'],
    notes: json['notes'],
    attachmentUrl: json['attachmentUrl'],
    isRecurring: json['isRecurring'] ?? false,
    recurringPattern: json['recurringPattern'],
    createdBy: json['createdBy'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Transaction ────────────────────────────────────────────────────────────

class FinanceTransaction {
  final String id;
  final String? description;
  final double amount;
  final TransactionType type;
  final String? category;
  final PaymentMethod paymentMethod;
  final DateTime date;
  final String? referenceId;
  final String? orderId;
  final String? branchId;
  final String? notes;
  final DateTime createdAt;

  const FinanceTransaction({
    required this.id,
    this.description,
    required this.amount,
    required this.type,
    this.category,
    this.paymentMethod = PaymentMethod.cash,
    required this.date,
    this.referenceId,
    this.orderId,
    this.branchId,
    this.notes,
    required this.createdAt,
  });

  bool get isCredit => type == TransactionType.income || type == TransactionType.refund;
  bool get isDebit => type == TransactionType.expense || type == TransactionType.transfer;

  factory FinanceTransaction.fromJson(Map<String, dynamic> json) => FinanceTransaction(
    id: json['id'] ?? '',
    description: json['description'],
    amount: (json['amount'] ?? 0).toDouble(),
    type: TransactionType.values.firstWhere((t) => t.name == json['type'], orElse: () => TransactionType.income),
    category: json['category'],
    paymentMethod: PaymentMethod.values.firstWhere((p) => p.name == json['paymentMethod'], orElse: () => PaymentMethod.cash),
    date: DateTime.tryParse(json['date'] ?? json['createdAt'] ?? '') ?? DateTime.now(),
    referenceId: json['referenceId'],
    orderId: json['orderId'],
    branchId: json['branchId'],
    notes: json['notes'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Invoice ────────────────────────────────────────────────────────────────

class Invoice {
  final String id;
  final String invoiceNumber;
  final InvoiceType type;
  final InvoiceStatus status;
  final String? orderId;
  final String? orderNumber;
  final String? customerName;
  final String? customerPhone;
  final String? branchId;
  final String? branchName;
  final List<InvoiceLineItem> items;
  final double subtotal;
  final double taxAmount;
  final double discount;
  final double total;
  final double amountPaid;
  final double amountDue;
  final PaymentMethod? paymentMethod;
  final DateTime invoiceDate;
  final DateTime? dueDate;
  final DateTime? paidAt;
  final String? notes;
  final DateTime createdAt;

  const Invoice({
    required this.id,
    required this.invoiceNumber,
    this.type = InvoiceType.sales,
    this.status = InvoiceStatus.draft,
    this.orderId,
    this.orderNumber,
    this.customerName,
    this.customerPhone,
    this.branchId,
    this.branchName,
    this.items = const [],
    this.subtotal = 0,
    this.taxAmount = 0,
    this.discount = 0,
    this.total = 0,
    this.amountPaid = 0,
    this.amountDue = 0,
    this.paymentMethod,
    required this.invoiceDate,
    this.dueDate,
    this.paidAt,
    this.notes,
    required this.createdAt,
  });

  bool get isPaid => status == InvoiceStatus.paid;
  bool get isOverdue => status == InvoiceStatus.overdue;

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
    id: json['id'] ?? '',
    invoiceNumber: json['invoiceNumber'] ?? json['invoice_number'] ?? '',
    type: InvoiceType.values.firstWhere((t) => t.name == json['type'], orElse: () => InvoiceType.sales),
    status: InvoiceStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => InvoiceStatus.draft),
    orderId: json['orderId'],
    orderNumber: json['orderNumber'],
    customerName: json['customerName'],
    customerPhone: json['customerPhone'],
    branchId: json['branchId'],
    branchName: json['branchName'],
    items: (json['items'] as List<dynamic>?)?.map((i) => InvoiceLineItem.fromJson(i)).toList() ?? [],
    subtotal: (json['subtotal'] ?? 0).toDouble(),
    taxAmount: (json['taxAmount'] ?? 0).toDouble(),
    discount: (json['discount'] ?? 0).toDouble(),
    total: (json['total'] ?? 0).toDouble(),
    amountPaid: (json['amountPaid'] ?? 0).toDouble(),
    amountDue: (json['amountDue'] ?? 0).toDouble(),
    paymentMethod: json['paymentMethod'] != null ? PaymentMethod.values.firstWhere((p) => p.name == json['paymentMethod'], orElse: () => PaymentMethod.cash) : null,
    invoiceDate: DateTime.tryParse(json['invoiceDate'] ?? json['date'] ?? '') ?? DateTime.now(),
    dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate']) : null,
    paidAt: json['paidAt'] != null ? DateTime.tryParse(json['paidAt']) : null,
    notes: json['notes'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class InvoiceLineItem {
  final String name;
  final int quantity;
  final double unitPrice;
  final double total;
  final double? taxRate;
  final bool isVeg;

  const InvoiceLineItem({
    required this.name,
    this.quantity = 1,
    this.unitPrice = 0,
    this.total = 0,
    this.taxRate,
    this.isVeg = true,
  });

  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) => InvoiceLineItem(
    name: json['name'] ?? '',
    quantity: json['quantity'] ?? 1,
    unitPrice: (json['unitPrice'] ?? 0).toDouble(),
    total: (json['total'] ?? 0).toDouble(),
    taxRate: json['taxRate']?.toDouble(),
    isVeg: json['isVeg'] ?? true,
  );
}

// ── Tax ────────────────────────────────────────────────────────────────────

class TaxSettings {
  final String? gstNumber;
  final String? panNumber;
  final double cgstRate;
  final double sgstRate;
  final double igstRate;
  final double cessRate;
  final bool taxInclusive;
  final String? businessName;
  final String? businessAddress;

  const TaxSettings({
    this.gstNumber,
    this.panNumber,
    this.cgstRate = 2.5,
    this.sgstRate = 2.5,
    this.igstRate = 5,
    this.cessRate = 0,
    this.taxInclusive = true,
    this.businessName,
    this.businessAddress,
  });

  double get totalGstRate => cgstRate + sgstRate + igstRate + cessRate;

  factory TaxSettings.fromJson(Map<String, dynamic> json) => TaxSettings(
    gstNumber: json['gstNumber'],
    panNumber: json['panNumber'],
    cgstRate: (json['cgstRate'] ?? 2.5).toDouble(),
    sgstRate: (json['sgstRate'] ?? 2.5).toDouble(),
    igstRate: (json['igstRate'] ?? 5).toDouble(),
    cessRate: (json['cessRate'] ?? 0).toDouble(),
    taxInclusive: json['taxInclusive'] ?? true,
    businessName: json['businessName'],
    businessAddress: json['businessAddress'],
  );
}

class GstSummary {
  final double totalRevenue;
  final double totalCgst;
  final double totalSgst;
  final double totalIgst;
  final double totalTax;
  final int taxableTransactions;
  final double avgPerInvoice;

  const GstSummary({
    this.totalRevenue = 0,
    this.totalCgst = 0,
    this.totalSgst = 0,
    this.totalIgst = 0,
    this.totalTax = 0,
    this.taxableTransactions = 0,
    this.avgPerInvoice = 0,
  });

  factory GstSummary.fromJson(Map<String, dynamic> json) => GstSummary(
    totalRevenue: (json['totalRevenue'] ?? 0).toDouble(),
    totalCgst: (json['totalCgst'] ?? 0).toDouble(),
    totalSgst: (json['totalSgst'] ?? 0).toDouble(),
    totalIgst: (json['totalIgst'] ?? 0).toDouble(),
    totalTax: (json['totalTax'] ?? 0).toDouble(),
    taxableTransactions: json['taxableTransactions'] ?? 0,
    avgPerInvoice: (json['avgPerInvoice'] ?? 0).toDouble(),
  );
}

// ── Bank Account ───────────────────────────────────────────────────────────

class BankAccount {
  final String id;
  final String name;
  final String? bankName;
  final String? accountNumber;
  final String? ifscCode;
  final double balance;
  final String type; // savings, current, cash
  final bool isActive;
  final DateTime createdAt;

  const BankAccount({
    required this.id,
    required this.name,
    this.bankName,
    this.accountNumber,
    this.ifscCode,
    this.balance = 0,
    this.type = 'current',
    this.isActive = true,
    required this.createdAt,
  });

  factory BankAccount.fromJson(Map<String, dynamic> json) => BankAccount(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    bankName: json['bankName'],
    accountNumber: json['accountNumber'],
    ifscCode: json['ifscCode'],
    balance: (json['balance'] ?? 0).toDouble(),
    type: json['type'] ?? 'current',
    isActive: json['isActive'] ?? true,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Settlement ─────────────────────────────────────────────────────────────

class Settlement {
  final String id;
  final SettlementProvider provider;
  final String? referenceId;
  final double grossAmount;
  final double fees;
  final double netAmount;
  final int transactionCount;
  final SettlementStatus status;
  final DateTime periodStart;
  final DateTime periodEnd;
  final DateTime? settledAt;
  final String? branchId;
  final DateTime createdAt;

  const Settlement({
    required this.id,
    required this.provider,
    this.referenceId,
    this.grossAmount = 0,
    this.fees = 0,
    this.netAmount = 0,
    this.transactionCount = 0,
    this.status = SettlementStatus.pending,
    required this.periodStart,
    required this.periodEnd,
    this.settledAt,
    this.branchId,
    required this.createdAt,
  });

  factory Settlement.fromJson(Map<String, dynamic> json) => Settlement(
    id: json['id'] ?? '',
    provider: SettlementProvider.values.firstWhere((p) => p.name == json['provider'], orElse: () => SettlementProvider.other),
    referenceId: json['referenceId'],
    grossAmount: (json['grossAmount'] ?? 0).toDouble(),
    fees: (json['fees'] ?? 0).toDouble(),
    netAmount: (json['netAmount'] ?? 0).toDouble(),
    transactionCount: json['transactionCount'] ?? 0,
    status: SettlementStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => SettlementStatus.pending),
    periodStart: DateTime.tryParse(json['periodStart'] ?? '') ?? DateTime.now(),
    periodEnd: DateTime.tryParse(json['periodEnd'] ?? '') ?? DateTime.now(),
    settledAt: json['settledAt'] != null ? DateTime.tryParse(json['settledAt']) : null,
    branchId: json['branchId'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Journal Entry (Accounting) ─────────────────────────────────────────────

class JournalEntry {
  final String id;
  final String entryNumber;
  final String description;
  final JournalEntryType type;
  final DateTime date;
  final List<JournalLine> lines;
  final double totalDebit;
  final double totalCredit;
  final String? createdBy;
  final bool isApproved;
  final DateTime createdAt;

  const JournalEntry({
    required this.id,
    required this.entryNumber,
    required this.description,
    this.type = JournalEntryType.standard,
    required this.date,
    this.lines = const [],
    this.totalDebit = 0,
    this.totalCredit = 0,
    this.createdBy,
    this.isApproved = false,
    required this.createdAt,
  });

  bool get isBalanced => (totalDebit - totalCredit).abs() < 0.01;

  factory JournalEntry.fromJson(Map<String, dynamic> json) => JournalEntry(
    id: json['id'] ?? '',
    entryNumber: json['entryNumber'] ?? '',
    description: json['description'] ?? '',
    type: JournalEntryType.values.firstWhere((t) => t.name == json['type'], orElse: () => JournalEntryType.standard),
    date: DateTime.tryParse(json['date'] ?? '') ?? DateTime.now(),
    lines: (json['lines'] as List<dynamic>?)?.map((l) => JournalLine.fromJson(l)).toList() ?? [],
    totalDebit: (json['totalDebit'] ?? 0).toDouble(),
    totalCredit: (json['totalCredit'] ?? 0).toDouble(),
    createdBy: json['createdBy'],
    isApproved: json['isApproved'] ?? false,
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class JournalLine {
  final String accountId;
  final String accountName;
  final AccountEntrySide side;
  final double amount;
  final String? description;

  const JournalLine({
    required this.accountId,
    required this.accountName,
    required this.side,
    required this.amount,
    this.description,
  });

  factory JournalLine.fromJson(Map<String, dynamic> json) => JournalLine(
    accountId: json['accountId'] ?? '',
    accountName: json['accountName'] ?? '',
    side: json['side'] == 'credit' ? AccountEntrySide.credit : AccountEntrySide.debit,
    amount: (json['amount'] ?? 0).toDouble(),
    description: json['description'],
  );
}

// ── Chart of Accounts ──────────────────────────────────────────────────────

class Account {
  final String id;
  final String code;
  final String name;
  final AccountType type;
  final String? parentId;
  final double balance;
  final bool isActive;

  const Account({
    required this.id,
    required this.code,
    required this.name,
    required this.type,
    this.parentId,
    this.balance = 0,
    this.isActive = true,
  });

  factory Account.fromJson(Map<String, dynamic> json) => Account(
    id: json['id'] ?? '',
    code: json['code'] ?? '',
    name: json['name'] ?? '',
    type: AccountType.values.firstWhere((t) => t.name == json['type'], orElse: () => AccountType.asset),
    parentId: json['parentId'],
    balance: (json['balance'] ?? 0).toDouble(),
    isActive: json['isActive'] ?? true,
  );
}

// ── Budget ─────────────────────────────────────────────────────────────────

class Budget {
  final String id;
  final String name;
  final String? branchId;
  final String? departmentId;
  final String period; // "2026-Q3", "2026-07"
  final double allocated;
  final double spent;
  final double remaining;
  final BudgetStatus status;
  final String? approvedBy;
  final DateTime createdAt;

  const Budget({
    required this.id,
    required this.name,
    this.branchId,
    this.departmentId,
    required this.period,
    this.allocated = 0,
    this.spent = 0,
    this.remaining = 0,
    this.status = BudgetStatus.draft,
    this.approvedBy,
    required this.createdAt,
  });

  double get utilizationPercent => allocated > 0 ? (spent / allocated * 100) : 0;
  bool get isExceeded => spent > allocated;

  factory Budget.fromJson(Map<String, dynamic> json) => Budget(
    id: json['id'] ?? '',
    name: json['name'] ?? '',
    branchId: json['branchId'],
    departmentId: json['departmentId'],
    period: json['period'] ?? '',
    allocated: (json['allocated'] ?? 0).toDouble(),
    spent: (json['spent'] ?? 0).toDouble(),
    remaining: (json['remaining'] ?? 0).toDouble(),
    status: BudgetStatus.values.firstWhere((s) => s.name == json['status'], orElse: () => BudgetStatus.draft),
    approvedBy: json['approvedBy'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

// ── Forecast ───────────────────────────────────────────────────────────────

class FinancialForecast {
  final String id;
  final ForecastType type;
  final String period;
  final double predicted;
  final double actual;
  final double variance;
  final double confidence; // 0-100
  final List<ForecastDataPoint> dataPoints;
  final String? notes;
  final DateTime createdAt;

  const FinancialForecast({
    required this.id,
    required this.type,
    required this.period,
    this.predicted = 0,
    this.actual = 0,
    this.variance = 0,
    this.confidence = 0,
    this.dataPoints = const [],
    this.notes,
    required this.createdAt,
  });

  factory FinancialForecast.fromJson(Map<String, dynamic> json) => FinancialForecast(
    id: json['id'] ?? '',
    type: ForecastType.values.firstWhere((t) => t.name == json['type'], orElse: () => ForecastType.revenue),
    period: json['period'] ?? '',
    predicted: (json['predicted'] ?? 0).toDouble(),
    actual: (json['actual'] ?? 0).toDouble(),
    variance: (json['variance'] ?? 0).toDouble(),
    confidence: (json['confidence'] ?? 0).toDouble(),
    dataPoints: (json['dataPoints'] as List<dynamic>?)?.map((d) => ForecastDataPoint.fromJson(d)).toList() ?? [],
    notes: json['notes'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class ForecastDataPoint {
  final String label;
  final double predicted;
  final double actual;

  const ForecastDataPoint({required this.label, this.predicted = 0, this.actual = 0});

  factory ForecastDataPoint.fromJson(Map<String, dynamic> json) => ForecastDataPoint(
    label: json['label'] ?? '',
    predicted: (json['predicted'] ?? 0).toDouble(),
    actual: (json['actual'] ?? 0).toDouble(),
  );
}

// ── Purchase Bill ──────────────────────────────────────────────────────────

class PurchaseBill {
  final String id;
  final String billNumber;
  final String? supplierId;
  final String? supplierName;
  final List<PurchaseBillItem> items;
  final double subtotal;
  final double taxAmount;
  final double total;
  final double amountPaid;
  final PaymentMethod paymentMethod;
  final DateTime billDate;
  final DateTime? dueDate;
  final String? branchId;
  final String? notes;
  final DateTime createdAt;

  const PurchaseBill({
    required this.id,
    required this.billNumber,
    this.supplierId,
    this.supplierName,
    this.items = const [],
    this.subtotal = 0,
    this.taxAmount = 0,
    this.total = 0,
    this.amountPaid = 0,
    this.paymentMethod = PaymentMethod.bankTransfer,
    required this.billDate,
    this.dueDate,
    this.branchId,
    this.notes,
    required this.createdAt,
  });

  double get amountDue => total - amountPaid;

  factory PurchaseBill.fromJson(Map<String, dynamic> json) => PurchaseBill(
    id: json['id'] ?? '',
    billNumber: json['billNumber'] ?? '',
    supplierId: json['supplierId'],
    supplierName: json['supplierName'],
    items: (json['items'] as List<dynamic>?)?.map((i) => PurchaseBillItem.fromJson(i)).toList() ?? [],
    subtotal: (json['subtotal'] ?? 0).toDouble(),
    taxAmount: (json['taxAmount'] ?? 0).toDouble(),
    total: (json['total'] ?? 0).toDouble(),
    amountPaid: (json['amountPaid'] ?? 0).toDouble(),
    paymentMethod: PaymentMethod.values.firstWhere((p) => p.name == json['paymentMethod'], orElse: () => PaymentMethod.bankTransfer),
    billDate: DateTime.tryParse(json['billDate'] ?? '') ?? DateTime.now(),
    dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate']) : null,
    branchId: json['branchId'],
    notes: json['notes'],
    createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
  );
}

class PurchaseBillItem {
  final String name;
  final int quantity;
  final double unitPrice;
  final double total;
  final String? category;

  const PurchaseBillItem({required this.name, this.quantity = 1, this.unitPrice = 0, this.total = 0, this.category});

  factory PurchaseBillItem.fromJson(Map<String, dynamic> json) => PurchaseBillItem(
    name: json['name'] ?? '',
    quantity: json['quantity'] ?? 1,
    unitPrice: (json['unitPrice'] ?? 0).toDouble(),
    total: (json['total'] ?? 0).toDouble(),
    category: json['category'],
  );
}

// ── Financial Report ───────────────────────────────────────────────────────

class FinancialReport {
  final String type;
  final double totalIncome;
  final double totalExpenses;
  final double netProfit;
  final double profitMargin;
  final List<ReportLineItem> incomeBreakdown;
  final List<ReportLineItem> expenseBreakdown;
  final Map<String, double> paymentMethodBreakdown;

  const FinancialReport({
    this.type = 'profit-loss',
    this.totalIncome = 0,
    this.totalExpenses = 0,
    this.netProfit = 0,
    this.profitMargin = 0,
    this.incomeBreakdown = const [],
    this.expenseBreakdown = const [],
    this.paymentMethodBreakdown = const {},
  });

  factory FinancialReport.fromJson(Map<String, dynamic> json) => FinancialReport(
    type: json['type'] ?? 'profit-loss',
    totalIncome: (json['totalIncome'] ?? json['income'] ?? 0).toDouble(),
    totalExpenses: (json['totalExpenses'] ?? json['expenses'] ?? 0).toDouble(),
    netProfit: (json['netProfit'] ?? 0).toDouble(),
    profitMargin: (json['profitMargin'] ?? 0).toDouble(),
    incomeBreakdown: (json['incomeBreakdown'] as List<dynamic>?)?.map((i) => ReportLineItem.fromJson(i)).toList() ?? [],
    expenseBreakdown: (json['expenseBreakdown'] as List<dynamic>?)?.map((i) => ReportLineItem.fromJson(i)).toList() ?? [],
    paymentMethodBreakdown: (json['paymentMethodBreakdown'] as Map<String, dynamic>?)?.map((k, v) => MapEntry(k, (v ?? 0).toDouble())) ?? {},
  );
}

class ReportLineItem {
  final String category;
  final double amount;
  final double? percentage;

  const ReportLineItem({required this.category, this.amount = 0, this.percentage});

  factory ReportLineItem.fromJson(Map<String, dynamic> json) => ReportLineItem(
    category: json['category'] ?? '',
    amount: (json['amount'] ?? 0).toDouble(),
    percentage: json['percentage']?.toDouble(),
  );
}

// ── Finance Filter ─────────────────────────────────────────────────────────

class FinanceFilter {
  final String? search;
  final String? branchId;
  final String? category;
  final DateTimeRange? dateRange;
  final TransactionType? transactionType;
  final PaymentMethod? paymentMethod;
  final InvoiceStatus? invoiceStatus;

  const FinanceFilter({
    this.search,
    this.branchId,
    this.category,
    this.dateRange,
    this.transactionType,
    this.paymentMethod,
    this.invoiceStatus,
  });

  bool get hasActiveFilters =>
      (search != null && search!.isNotEmpty) ||
      branchId != null ||
      category != null ||
      dateRange != null ||
      transactionType != null ||
      paymentMethod != null ||
      invoiceStatus != null;

  FinanceFilter copyWith({
    String? search,
    String? branchId,
    String? category,
    DateTimeRange? dateRange,
    TransactionType? transactionType,
    PaymentMethod? paymentMethod,
    InvoiceStatus? invoiceStatus,
    bool clearSearch = false,
    bool clearBranch = false,
    bool clearCategory = false,
    bool clearDateRange = false,
    bool clearType = false,
    bool clearPaymentMethod = false,
    bool clearInvoiceStatus = false,
  }) => FinanceFilter(
    search: clearSearch ? null : (search ?? this.search),
    branchId: clearBranch ? null : (branchId ?? this.branchId),
    category: clearCategory ? null : (category ?? this.category),
    dateRange: clearDateRange ? null : (dateRange ?? this.dateRange),
    transactionType: clearType ? null : (transactionType ?? this.transactionType),
    paymentMethod: clearPaymentMethod ? null : (paymentMethod ?? this.paymentMethod),
    invoiceStatus: clearInvoiceStatus ? null : (invoiceStatus ?? this.invoiceStatus),
  );
}

// ── AI Finance Insights ────────────────────────────────────────────────────

class FinanceInsight {
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final String severity; // High, Medium, Low, Info

  const FinanceInsight(this.title, this.description, this.icon, this.color, this.severity);
}

class FinanceForecastItem {
  final String title;
  final String description;
  final String value;
  final Color color;

  const FinanceForecastItem(this.title, this.description, this.value, this.color);
}

// ── Status Helpers ─────────────────────────────────────────────────────────

class FinanceStatusHelpers {
  static Color invoiceStatusColor(InvoiceStatus status) {
    switch (status) {
      case InvoiceStatus.draft: return const Color(0xFF94A3B8);
      case InvoiceStatus.sent: return const Color(0xFF3B82F6);
      case InvoiceStatus.paid: return const Color(0xFF10B981);
      case InvoiceStatus.partiallyPaid: return const Color(0xFFF59E0B);
      case InvoiceStatus.overdue: return const Color(0xFFEF4444);
      case InvoiceStatus.cancelled: return const Color(0xFF6B7280);
      case InvoiceStatus.void_: return const Color(0xFF9CA3AF);
    }
  }

  static Color settlementStatusColor(SettlementStatus status) {
    switch (status) {
      case SettlementStatus.pending: return const Color(0xFFF59E0B);
      case SettlementStatus.processing: return const Color(0xFF3B82F6);
      case SettlementStatus.completed: return const Color(0xFF10B981);
      case SettlementStatus.failed: return const Color(0xFFEF4444);
      case SettlementStatus.reconciled: return const Color(0xFF8B5CF6);
    }
  }

  static Color accountTypeColor(AccountType type) {
    switch (type) {
      case AccountType.asset: return const Color(0xFF10B981);
      case AccountType.liability: return const Color(0xFFEF4444);
      case AccountType.equity: return const Color(0xFF3B82F6);
      case AccountType.revenue: return const Color(0xFF22C55E);
      case AccountType.expense: return const Color(0xFFF59E0B);
    }
  }

  static Color budgetStatusColor(BudgetStatus status) {
    switch (status) {
      case BudgetStatus.draft: return const Color(0xFF94A3B8);
      case BudgetStatus.active: return const Color(0xFF10B981);
      case BudgetStatus.completed: return const Color(0xFF3B82F6);
      case BudgetStatus.exceeded: return const Color(0xFFEF4444);
    }
  }

  static String invoiceStatusLabel(InvoiceStatus status) {
    switch (status) {
      case InvoiceStatus.draft: return 'Draft';
      case InvoiceStatus.sent: return 'Sent';
      case InvoiceStatus.paid: return 'Paid';
      case InvoiceStatus.partiallyPaid: return 'Partial';
      case InvoiceStatus.overdue: return 'Overdue';
      case InvoiceStatus.cancelled: return 'Cancelled';
      case InvoiceStatus.void_: return 'Void';
    }
  }

  static String settlementStatusLabel(SettlementStatus status) {
    switch (status) {
      case SettlementStatus.pending: return 'Pending';
      case SettlementStatus.processing: return 'Processing';
      case SettlementStatus.completed: return 'Completed';
      case SettlementStatus.failed: return 'Failed';
      case SettlementStatus.reconciled: return 'Reconciled';
    }
  }

  static String paymentMethodLabel(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cash: return 'Cash';
      case PaymentMethod.card: return 'Card';
      case PaymentMethod.upi: return 'UPI';
      case PaymentMethod.googlePay: return 'Google Pay';
      case PaymentMethod.phonePe: return 'PhonePe';
      case PaymentMethod.paytm: return 'Paytm';
      case PaymentMethod.wallet: return 'Wallet';
      case PaymentMethod.giftCard: return 'Gift Card';
      case PaymentMethod.bankTransfer: return 'Bank Transfer';
      case PaymentMethod.split: return 'Split';
      case PaymentMethod.other: return 'Other';
    }
  }

  static String settlementProviderLabel(SettlementProvider provider) {
    switch (provider) {
      case SettlementProvider.razorpay: return 'Razorpay';
      case SettlementProvider.stripe: return 'Stripe';
      case SettlementProvider.phonePe: return 'PhonePe';
      case SettlementProvider.cashfree: return 'Cashfree';
      case SettlementProvider.paytm: return 'Paytm';
      case SettlementProvider.other: return 'Other';
    }
  }

  static String accountTypeLabel(AccountType type) {
    switch (type) {
      case AccountType.asset: return 'Asset';
      case AccountType.liability: return 'Liability';
      case AccountType.equity: return 'Equity';
      case AccountType.revenue: return 'Revenue';
      case AccountType.expense: return 'Expense';
    }
  }

  static String budgetStatusLabel(BudgetStatus status) {
    switch (status) {
      case BudgetStatus.draft: return 'Draft';
      case BudgetStatus.active: return 'Active';
      case BudgetStatus.completed: return 'Completed';
      case BudgetStatus.exceeded: return 'Exceeded';
    }
  }

  static String formatCurrency(double amount) {
    if (amount >= 10000000) return '₹${(amount / 10000000).toStringAsFixed(1)}Cr';
    if (amount >= 100000) return '₹${(amount / 100000).toStringAsFixed(1)}L';
    if (amount >= 1000) return '₹${(amount / 1000).toStringAsFixed(1)}K';
    return '₹${amount.toStringAsFixed(0)}';
  }
}
