import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KpiService } from './kpi.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { requestContext } from '../../prisma/prisma.service';

@ApiTags('dashboard-kpi')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('dashboard')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  private get tenantId(): string {
    const ctx = requestContext.getStore();
    return ctx?.tenantId || '';
  }

  // ── KPI Goals ──

  @Get('kpi/goals')
  @ApiOperation({ summary: 'Get all KPI goals' })
  getGoals() {
    return this.kpiService.getGoals(this.tenantId);
  }

  @Get('kpi/goals/progress')
  @ApiOperation({ summary: 'Get KPI goals with current progress' })
  getGoalProgress() {
    return this.kpiService.getGoalProgress(this.tenantId);
  }

  @Post('kpi/goals')
  @ApiOperation({ summary: 'Create a KPI goal' })
  createGoal(@Body() body: {
    branchId?: string;
    metric: string;
    target: number;
    period?: string;
    startDate: string;
    endDate?: string;
  }) {
    return this.kpiService.createGoal(this.tenantId, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Patch('kpi/goals/:id')
  @ApiOperation({ summary: 'Update a KPI goal' })
  updateGoal(
    @Param('id') id: string,
    @Body() body: { target?: number; period?: string; endDate?: string },
  ) {
    return this.kpiService.updateGoal(id, this.tenantId, {
      ...body,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Delete('kpi/goals/:id')
  @ApiOperation({ summary: 'Delete a KPI goal' })
  deleteGoal(@Param('id') id: string) {
    return this.kpiService.deleteGoal(id, this.tenantId);
  }

  // ── KPI Alerts ──

  @Get('kpi/alerts')
  @ApiOperation({ summary: 'Get KPI alerts' })
  @ApiQuery({ name: 'status', required: false })
  getAlerts(@Query('status') status?: string) {
    return this.kpiService.getAlerts(this.tenantId, status);
  }

  @Get('kpi/alerts/summary')
  @ApiOperation({ summary: 'Get alert count summary' })
  getAlertSummary() {
    return this.kpiService.getAlertSummary(this.tenantId);
  }

  @Post('kpi/alerts')
  @ApiOperation({ summary: 'Create a KPI alert' })
  createAlert(@Body() body: {
    branchId?: string;
    metric: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    value?: number;
    threshold?: number;
  }) {
    return this.kpiService.createAlert({ tenantId: this.tenantId, ...body });
  }

  @Patch('kpi/alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a KPI alert' })
  acknowledgeAlert(@Param('id') id: string) {
    return this.kpiService.acknowledgeAlert(id, this.tenantId);
  }

  @Patch('kpi/alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve a KPI alert' })
  resolveAlert(@Param('id') id: string) {
    return this.kpiService.resolveAlert(id, this.tenantId);
  }
}
