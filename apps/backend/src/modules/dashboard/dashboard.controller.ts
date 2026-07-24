import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { requestContext } from '../../prisma/prisma.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly snapshotService: AnalyticsSnapshotService,
  ) {}

  private get tenantId(): string {
    const ctx = requestContext.getStore();
    return ctx?.tenantId || '';
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats (today\'s orders, revenue, occupancy, alerts)' })
  getStats(@Query() dto: DashboardFilterDto) {
    return this.dashboardService.getStats(dto.branchId);
  }

  @Get('recent-orders')
  @ApiOperation({ summary: 'Get recent orders for dashboard widget' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getRecentOrders(
    @Query('branchId') branchId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.dashboardService.getRecentOrders(branchId, limit);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  getHealth() {
    return this.snapshotService.getSystemHealth();
  }

  @Get('snapshots')
  @ApiOperation({ summary: 'Get analytics snapshots' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['daily', 'hourly', 'branch'] })
  getSnapshots(
    @Query('branchId') branchId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: 'daily' | 'hourly' | 'branch',
  ) {
    return this.snapshotService.getSnapshots(this.tenantId, {
      branchId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      type,
    });
  }

  @Post('snapshots/compute')
  @ApiOperation({ summary: 'Trigger snapshot computation' })
  computeSnapshots(@Body() body: { branchId?: string }) {
    return this.snapshotService.computeAllSnapshots(this.tenantId, body.branchId);
  }

  @Get('executive-summary')
  @ApiOperation({ summary: 'Get executive summary (revenue, profit, AOV)' })
  @ApiQuery({ name: 'branchId', required: false })
  getExecutiveSummary(@Query('branchId') branchId?: string) {
    return this.dashboardService.getExecutiveSummary(branchId);
  }

  @Get('revenue-trend')
  @ApiOperation({ summary: 'Get revenue trend over time' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'days', required: false })
  getRevenueTrend(
    @Query('branchId') branchId?: string,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getRevenueTrend(branchId, days ? parseInt(days) : 30);
  }

  @Get('profitability')
  @ApiOperation({ summary: 'Get profitability breakdown' })
  @ApiQuery({ name: 'branchId', required: false })
  getProfitability(@Query('branchId') branchId?: string) {
    return this.dashboardService.getProfitability(branchId);
  }
}
