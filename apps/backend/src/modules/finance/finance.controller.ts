import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FinanceFilterDto } from './dto/finance-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentBranch } from './decorators/current-branch.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('overview')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get financial overview' })
  getOverview(
    @CurrentTenant() tenantId: string,
    @CurrentBranch('id') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.getOverview(branchId, from, to);
  }

  @Get('transactions')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get paginated transactions' })
  getTransactions(
    @CurrentTenant() tenantId: string,
    @CurrentBranch('id') branchId: string,
    @Query() filter: FinanceFilterDto,
  ) {
    return this.financeService.getTransactions(branchId, filter);
  }

  @Get('transactions/:id')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get single transaction' })
  getTransaction(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.financeService.getTransaction(id, tenantId);
  }

  @Post('transactions')
  @RequirePermissions('finance:write')
  @ApiOperation({ summary: 'Create a new transaction' })
  createTransaction(
    @CurrentBranch('id') branchId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.financeService.createTransaction(branchId, dto);
  }

  @Patch('transactions/:id')
  @RequirePermissions('finance:write')
  @ApiOperation({ summary: 'Update a transaction' })
  updateTransaction(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financeService.updateTransaction(id, dto, tenantId);
  }

  @Delete('transactions/:id')
  @RequirePermissions('finance:delete')
  @ApiOperation({ summary: 'Delete a transaction' })
  deleteTransaction(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteTransaction(id, tenantId);
  }

  @Get('expenses/category')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get expenses grouped by category' })
  getExpensesByCategory(
    @CurrentBranch('id') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.getExpensesByCategory(branchId, from, to);
  }

  @Get('income/category')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get income grouped by category' })
  getIncomeByCategory(
    @CurrentBranch('id') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.getIncomeByCategory(branchId, from, to);
  }

  // ── Income CRUD (maps to transactions with type=INCOME) ──

  @Get('income')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get paginated income transactions' })
  getIncome(
    @CurrentTenant() tenantId: string,
    @CurrentBranch('id') branchId: string,
    @Query() filter: FinanceFilterDto,
  ) {
    return this.financeService.getTransactionsByType(branchId, 'INCOME', filter);
  }

  @Post('income')
  @RequirePermissions('finance:write')
  @ApiOperation({ summary: 'Create an income transaction' })
  createIncome(
    @CurrentBranch('id') branchId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.financeService.createTransaction(branchId, { ...dto, type: 'INCOME' });
  }

  @Patch('income/:id')
  @RequirePermissions('finance:write')
  @ApiOperation({ summary: 'Update an income transaction' })
  updateIncome(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financeService.updateTransaction(id, dto, tenantId);
  }

  @Delete('income/:id')
  @RequirePermissions('finance:delete')
  @ApiOperation({ summary: 'Delete an income transaction' })
  deleteIncome(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteTransaction(id, tenantId);
  }

  // ── Expenses CRUD (maps to transactions with type=EXPENSE) ──

  @Get('expenses')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get paginated expense transactions' })
  getExpenses(
    @CurrentTenant() tenantId: string,
    @CurrentBranch('id') branchId: string,
    @Query() filter: FinanceFilterDto,
  ) {
    return this.financeService.getTransactionsByType(branchId, 'EXPENSE', filter);
  }

  @Post('expenses')
  @RequirePermissions('finance:write')
  @ApiOperation({ summary: 'Create an expense transaction' })
  createExpense(
    @CurrentBranch('id') branchId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.financeService.createTransaction(branchId, { ...dto, type: 'EXPENSE' });
  }

  @Patch('expenses/:id')
  @RequirePermissions('finance:write')
  @ApiOperation({ summary: 'Update an expense transaction' })
  updateExpense(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financeService.updateTransaction(id, dto, tenantId);
  }

  @Delete('expenses/:id')
  @RequirePermissions('finance:delete')
  @ApiOperation({ summary: 'Delete an expense transaction' })
  deleteExpense(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.financeService.deleteTransaction(id, tenantId);
  }

  // ── Tax / GST endpoints ──

  @Get('tax')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get tax settings for tenant' })
  getTaxSettings(@CurrentTenant() tenantId: string) {
    return this.financeService.getTaxSettings(tenantId);
  }

  @Patch('tax')
  @RequirePermissions('finance:write')
  @ApiOperation({ summary: 'Update tax settings' })
  updateTaxSettings(
    @CurrentTenant() tenantId: string,
    @Body() dto: { gstRate?: number; serviceTax?: number; packagingCharge?: number; taxEnabled?: boolean },
  ) {
    return this.financeService.updateTaxSettings(tenantId, dto);
  }

  @Get('tax/gst-summary')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get GST summary report' })
  getGstSummary(
    @CurrentTenant() tenantId: string,
    @CurrentBranch('id') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.getGstSummary(branchId, from, to);
  }

  @Get('tax/reports')
  @RequirePermissions('finance:read')
  @ApiOperation({ summary: 'Get tax reports' })
  getTaxReports(
    @CurrentTenant() tenantId: string,
    @CurrentBranch('id') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.financeService.getTaxReports(branchId, from, to);
  }
}
