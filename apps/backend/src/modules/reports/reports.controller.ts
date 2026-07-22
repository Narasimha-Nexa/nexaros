import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ReportFilterDto } from './dto/report-filter.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-sales')
  @ApiOperation({ summary: 'Daily sales report with revenue, orders, averages' })
  dailySales(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.dailySales(tenantId, dto);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue breakdown by category and item' })
  revenue(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.revenue(tenantId, dto);
  }

  @Get('items')
  @ApiOperation({ summary: 'Item performance — top sellers and low performers' })
  itemPerformance(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.itemPerformance(tenantId, dto);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Peak hours analysis based on order history' })
  peakHours(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.peakHours(tenantId, dto);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Staff performance metrics (orders, revenue)' })
  staffPerformance(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.staffPerformance(tenantId, dto);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory consumption report with low stock alerts' })
  inventoryConsumption(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.inventoryConsumption(tenantId, dto);
  }

  @Get('customers')
  @ApiOperation({ summary: 'Customer analytics — acquisition, retention, segmentation' })
  customerAnalytics(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.customerAnalytics(tenantId, dto);
  }

  @Get('kitchen')
  @ApiOperation({ summary: 'Kitchen analytics — prep times, order volume, KDS metrics' })
  kitchenAnalytics(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.kitchenAnalytics(tenantId, dto);
  }

  @Get('delivery')
  @ApiOperation({ summary: 'Delivery analytics — times, partner stats, zone analysis' })
  deliveryAnalytics(@CurrentTenant() tenantId: string, @Query() dto: ReportFilterDto) {
    return this.reportsService.deliveryAnalytics(tenantId, dto);
  }

  @Get('export/:type')
  @ApiOperation({ summary: 'Export report data (daily-sales, revenue, items)' })
  exportReport(
    @CurrentTenant() tenantId: string,
    @Param('type') type: string,
    @Query() dto: ReportFilterDto,
  ) {
    return this.reportsService.exportReport(tenantId, type, dto);
  }

  @Get('finance/:type')
  @ApiOperation({ summary: 'Get finance report by type (income, expenses, tax, overview)' })
  financeReport(
    @CurrentTenant() tenantId: string,
    @Param('type') type: string,
    @Query() dto: ReportFilterDto,
  ) {
    return this.reportsService.financeReport(tenantId, type, dto);
  }
}
