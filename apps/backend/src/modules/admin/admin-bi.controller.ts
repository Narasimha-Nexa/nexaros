import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { BiService } from '../bi/bi.service';
import { ForecastService } from '../forecast/forecast.service';
import { AdminBiQueryDto, AdminForecastQueryDto } from './dto/admin-bi.dto';

@ApiTags('Admin BI')
@Controller('admin/bi')
// EntitlementsGuard is intentionally omitted: it reads request.user.tenantId
// to check tenant subscription status, but admin requests carry identity on
// request.admin (set by AdminAuthGuard). Without tenantId the guard is a
// no-op, so it provides no real access control for platform-level admins.
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminBiController {
  constructor(private bi: BiService, private forecast: ForecastService) {}

  @Get('executive-summary')
  @ApiOperation({ summary: 'Executive KPI summary (admin, tenant-scoped)' })
  executiveSummary(@Query() dto: AdminBiQueryDto) {
    return this.bi.executiveSummary(dto.tenantId, dto);
  }

  @Get('revenue-trend')
  @ApiOperation({ summary: 'Revenue trend over time' })
  revenueTrend(@Query() dto: AdminBiQueryDto) {
    return this.bi.revenueTrend(dto.tenantId, dto);
  }

  @Get('orders-trend')
  @ApiOperation({ summary: 'Orders trend over time' })
  ordersTrend(@Query() dto: AdminBiQueryDto) {
    return this.bi.ordersTrend(dto.tenantId, dto);
  }

  @Get('customer-trend')
  @ApiOperation({ summary: 'Customer trend over time' })
  customerTrend(@Query() dto: AdminBiQueryDto) {
    return this.bi.customerTrend(dto.tenantId, dto);
  }

  @Get('profitability')
  @ApiOperation({ summary: 'Profitability analysis' })
  profitability(@Query() dto: AdminBiQueryDto) {
    return this.bi.profitability(dto.tenantId, dto);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Peak hours analysis' })
  peakHours(@Query() dto: AdminBiQueryDto) {
    return this.bi.peakHours(dto.tenantId, dto);
  }

  @Get('top-items')
  @ApiOperation({ summary: 'Top selling items' })
  topItems(@Query() dto: AdminBiQueryDto) {
    return this.bi.topItems(dto.tenantId, dto);
  }

  @Get('branch-leaderboard')
  @ApiOperation({ summary: 'Branch performance leaderboard' })
  branchLeaderboard(@Query() dto: AdminBiQueryDto) {
    return this.bi.branchLeaderboard(dto.tenantId, dto);
  }

  @Get('branch-comparison')
  @ApiOperation({ summary: 'Compare branches side by side' })
  branchComparison(@Query() dto: AdminBiQueryDto) {
    return this.bi.branchComparison(dto.tenantId, dto);
  }

  @Get('regional-performance')
  @ApiOperation({ summary: 'Regional performance breakdown' })
  regionalPerformance(@Query() dto: AdminBiQueryDto) {
    return this.bi.regionalPerformance(dto.tenantId, dto);
  }

  @Get('insights')
  @ApiOperation({ summary: 'AI-generated business insights' })
  insights(@Query() dto: AdminBiQueryDto) {
    return this.bi.insights(dto.tenantId, dto);
  }

  @Get('goals')
  @ApiOperation({ summary: 'Get KPI goals' })
  getGoals(@Query() dto: AdminBiQueryDto) {
    return this.bi.getGoals(dto.tenantId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get business alerts' })
  getAlerts(@Query() dto: AdminBiQueryDto) {
    return this.bi.getAlerts(dto.tenantId);
  }

  @Get('forecast/revenue')
  @ApiOperation({ summary: 'Forecast revenue' })
  forecastRevenue(@Query() dto: AdminForecastQueryDto) {
    return this.forecast.revenue(dto.tenantId, dto);
  }

  @Get('forecast/orders')
  @ApiOperation({ summary: 'Forecast orders' })
  forecastOrders(@Query() dto: AdminForecastQueryDto) {
    return this.forecast.orders(dto.tenantId, dto);
  }

  @Get('forecast/inventory')
  @ApiOperation({ summary: 'Forecast inventory needs' })
  forecastInventory(@Query() dto: AdminForecastQueryDto) {
    return this.forecast.inventory(dto.tenantId, dto);
  }

  @Get('forecast/staffing')
  @ApiOperation({ summary: 'Forecast staffing needs' })
  forecastStaffing(@Query() dto: AdminForecastQueryDto) {
    return this.forecast.staffing(dto.tenantId, dto);
  }
}
