import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BiService } from './bi.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { BiQueryDto, GoalDto } from './dto';

@ApiTags('bi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bi')
export class BiController {
  constructor(private readonly biService: BiService) {}

  @Get('executive-summary')
  @ApiOperation({ summary: 'Executive KPI scorecards' })
  executiveSummary(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.executiveSummary(tenantId, dto);
  }

  @Get('revenue-trend')
  @ApiOperation({ summary: 'Revenue trend with optional period comparison' })
  revenueTrend(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.revenueTrend(tenantId, dto);
  }

  @Get('orders-trend')
  @ApiOperation({ summary: 'Orders trend over time' })
  ordersTrend(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.ordersTrend(tenantId, dto);
  }

  @Get('customer-trend')
  @ApiOperation({ summary: 'Customer acquisition & retention trend' })
  customerTrend(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.customerTrend(tenantId, dto);
  }

  @Get('profitability')
  @ApiOperation({ summary: 'Profitability panel (margins, food/labor cost)' })
  profitability(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.profitability(tenantId, dto);
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Peak hours & weekday distribution' })
  peakHours(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.peakHours(tenantId, dto);
  }

  @Get('top-items')
  @ApiOperation({ summary: 'Top selling menu items' })
  topItems(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.topItems(tenantId, dto);
  }

  @Get('branch-leaderboard')
  @ApiOperation({ summary: 'Branch benchmarking leaderboard' })
  branchLeaderboard(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.branchLeaderboard(tenantId, dto);
  }

  @Get('branch-comparison')
  @ApiOperation({ summary: 'Compare up to 4 branches' })
  branchComparison(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.branchComparison(tenantId, dto);
  }

  @Get('regional-performance')
  @ApiOperation({ summary: 'Regional performance rollup' })
  regionalPerformance(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.regionalPerformance(tenantId, dto);
  }

  @Get('insights')
  @ApiOperation({ summary: 'AI-generated business insights' })
  insights(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.insights(tenantId, dto);
  }

  @Get('goals')
  @ApiOperation({ summary: 'List KPI goals' })
  getGoals(@CurrentTenant() tenantId: string) {
    return this.biService.getGoals(tenantId);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Create a KPI goal' })
  createGoal(@CurrentTenant() tenantId: string, @Body() dto: GoalDto) {
    return this.biService.createGoal(tenantId, dto);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'List KPI alerts' })
  getAlerts(@CurrentTenant() tenantId: string) {
    return this.biService.getAlerts(tenantId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export analytics as CSV' })
  exportCsv(@CurrentTenant() tenantId: string, @Query() dto: BiQueryDto) {
    return this.biService.exportCsv(tenantId, dto);
  }
}
