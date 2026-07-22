import '../../../core/network/api_client.dart';
import 'finance_models.dart';

class FinanceService {
  final ApiClient _api;
  FinanceService(this._api);

  // ── Overview ───────────────────────────────────────────────────────────

  Future<FinanceOverview> getOverview({String? startDate, String? endDate}) async {
    final data = await _api.getFinanceOverview(startDate: startDate, endDate: endDate);
    return FinanceOverview.fromJson(data);
  }

  // ── Income ─────────────────────────────────────────────────────────────

  Future<List<IncomeEntry>> getIncome({String? startDate, String? endDate, String? category, int? page}) async {
    final data = await _api.getIncome(startDate: startDate, endDate: endDate, category: category, page: page);
    return (data as List<dynamic>).map((json) => IncomeEntry.fromJson(json)).toList();
  }

  Future<IncomeEntry> createIncome(Map<String, dynamic> data) async {
    final result = await _api.createIncome(data);
    return IncomeEntry.fromJson(result);
  }

  Future<IncomeEntry> updateIncome(String id, Map<String, dynamic> data) async {
    final result = await _api.updateIncome(id, data);
    return IncomeEntry.fromJson(result);
  }

  Future<void> deleteIncome(String id) async {
    await _api.deleteIncome(id);
  }

  // ── Expenses ───────────────────────────────────────────────────────────

  Future<List<ExpenseEntry>> getExpenses({String? startDate, String? endDate, String? category, int? page}) async {
    final data = await _api.getExpenses(startDate: startDate, endDate: endDate, category: category, page: page);
    return (data as List<dynamic>).map((json) => ExpenseEntry.fromJson(json)).toList();
  }

  Future<ExpenseEntry> createExpense(Map<String, dynamic> data) async {
    final result = await _api.createExpense(data);
    return ExpenseEntry.fromJson(result);
  }

  Future<ExpenseEntry> updateExpense(String id, Map<String, dynamic> data) async {
    final result = await _api.updateExpense(id, data);
    return ExpenseEntry.fromJson(result);
  }

  Future<void> deleteExpense(String id) async {
    await _api.deleteExpense(id);
  }

  // ── Transactions ───────────────────────────────────────────────────────

  Future<List<FinanceTransaction>> getTransactions({String? startDate, String? endDate, String? type, String? category, String? search, int? page}) async {
    final data = await _api.getFinanceTransactions(startDate: startDate, endDate: endDate, type: type, category: category, search: search, page: page);
    return (data as List<dynamic>).map((json) => FinanceTransaction.fromJson(json)).toList();
  }

  // ── Invoices ───────────────────────────────────────────────────────────

  Future<List<Invoice>> getInvoices({String? branchId}) async {
    final data = await _api.getInvoices(branchId: branchId);
    return (data as List<dynamic>).map((json) => Invoice.fromJson(json)).toList();
  }

  Future<Invoice> generateInvoice(String paymentId) async {
    final data = await _api.generateInvoice(paymentId);
    return Invoice.fromJson(data);
  }

  // ── Tax ────────────────────────────────────────────────────────────────

  Future<TaxSettings> getTaxSettings() async {
    final data = await _api.getTaxSettings();
    return TaxSettings.fromJson(data);
  }

  Future<TaxSettings> updateTaxSettings(Map<String, dynamic> data) async {
    final result = await _api.updateTaxSettings(data);
    return TaxSettings.fromJson(result);
  }

  Future<GstSummary> getGstSummary({String? fromDate, String? toDate}) async {
    final data = await _api.getGstSummary(fromDate: fromDate, toDate: toDate);
    return GstSummary.fromJson(data);
  }

  // ── Reports ────────────────────────────────────────────────────────────

  Future<FinancialReport> getFinancialReport(String type, {String? startDate, String? endDate}) async {
    final data = await _api.getFinanceReport(type, startDate: startDate, endDate: endDate);
    return FinancialReport.fromJson(data);
  }

  // ── Banking ────────────────────────────────────────────────────────────

  Future<List<BankAccount>> getBankAccounts() async {
    final data = await _api.get('/finance/bank-accounts');
    return (data as List<dynamic>).map((json) => BankAccount.fromJson(json)).toList();
  }

  Future<BankAccount> createBankAccount(Map<String, dynamic> data) async {
    final result = await _api.post('/finance/bank-accounts', data);
    return BankAccount.fromJson(result);
  }

  Future<void> reconcileBankAccount(String id, double statementBalance) async {
    await _api.put('/finance/bank-accounts/$id/reconcile', {'statementBalance': statementBalance});
  }

  // ── Settlements ────────────────────────────────────────────────────────

  Future<List<Settlement>> getSettlements({String? provider, String? status, String? branchId}) async {
    final params = <String, String>{};
    if (provider != null) params['provider'] = provider;
    if (status != null) params['status'] = status;
    if (branchId != null) params['branchId'] = branchId;
    final data = await _api.get('/finance/settlements', queryParameters: params);
    return (data as List<dynamic>).map((json) => Settlement.fromJson(json)).toList();
  }

  Future<Settlement> reconcileSettlement(String id) async {
    final result = await _api.put('/finance/settlements/$id/reconcile', {});
    return Settlement.fromJson(result);
  }

  // ── Accounting ─────────────────────────────────────────────────────────

  Future<List<JournalEntry>> getJournalEntries({String? startDate, String? endDate}) async {
    final params = <String, String>{};
    if (startDate != null) params['startDate'] = startDate;
    if (endDate != null) params['endDate'] = endDate;
    final data = await _api.get('/finance/journal', queryParameters: params);
    return (data as List<dynamic>).map((json) => JournalEntry.fromJson(json)).toList();
  }

  Future<JournalEntry> createJournalEntry(Map<String, dynamic> data) async {
    final result = await _api.post('/finance/journal', data);
    return JournalEntry.fromJson(result);
  }

  Future<List<Account>> getChartOfAccounts() async {
    final data = await _api.get('/finance/accounts');
    return (data as List<dynamic>).map((json) => Account.fromJson(json)).toList();
  }

  Future<Account> createAccount(Map<String, dynamic> data) async {
    final result = await _api.post('/finance/accounts', data);
    return Account.fromJson(result);
  }

  // ── Purchase Bills ─────────────────────────────────────────────────────

  Future<List<PurchaseBill>> getPurchaseBills({String? branchId, String? status}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    if (status != null) params['status'] = status;
    final data = await _api.get('/finance/purchase-bills', queryParameters: params);
    return (data as List<dynamic>).map((json) => PurchaseBill.fromJson(json)).toList();
  }

  Future<PurchaseBill> createPurchaseBill(Map<String, dynamic> data) async {
    final result = await _api.post('/finance/purchase-bills', data);
    return PurchaseBill.fromJson(result);
  }

  // ── Budgeting ──────────────────────────────────────────────────────────

  Future<List<Budget>> getBudgets({String? branchId, String? period}) async {
    final params = <String, String>{};
    if (branchId != null) params['branchId'] = branchId;
    if (period != null) params['period'] = period;
    final data = await _api.get('/finance/budgets', queryParameters: params);
    return (data as List<dynamic>).map((json) => Budget.fromJson(json)).toList();
  }

  Future<Budget> createBudget(Map<String, dynamic> data) async {
    final result = await _api.post('/finance/budgets', data);
    return Budget.fromJson(result);
  }

  Future<Budget> approveBudget(String id) async {
    final result = await _api.put('/finance/budgets/$id/approve', {});
    return Budget.fromJson(result);
  }

  // ── Forecasting ────────────────────────────────────────────────────────

  Future<List<FinancialForecast>> getForecasts({String? type}) async {
    final params = <String, String>{};
    if (type != null) params['type'] = type;
    final data = await _api.get('/finance/forecasts', queryParameters: params);
    return (data as List<dynamic>).map((json) => FinancialForecast.fromJson(json)).toList();
  }

  Future<FinancialForecast> generateForecast(String type, String period) async {
    final result = await _api.post('/finance/forecasts/generate', {'type': type, 'period': period});
    return FinancialForecast.fromJson(result);
  }
}
