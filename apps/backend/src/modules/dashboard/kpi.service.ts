import { Injectable } from '@nestjs/common';
import { PrismaService, requestContext } from '../../prisma/prisma.service';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';

@Injectable()
export class KpiService {
  constructor(
    private prisma: PrismaService,
    private snapshotService: AnalyticsSnapshotService,
  ) {}

  async getGoals(tenantId: string) {
    return this.prisma.kpiGoal.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(tenantId: string, data: {
    branchId?: string;
    metric: string;
    target: number;
    period?: string;
    startDate: Date;
    endDate?: Date;
    createdBy?: string;
  }) {
    return this.prisma.kpiGoal.create({
      data: {
        tenantId,
        branchId: data.branchId || null,
        metric: data.metric,
        target: data.target,
        period: data.period || 'monthly',
        startDate: data.startDate,
        endDate: data.endDate || null,
        createdBy: data.createdBy || null,
      },
    });
  }

  async updateGoal(goalId: string, tenantId: string, data: {
    target?: number;
    period?: string;
    endDate?: Date;
  }) {
    return this.prisma.kpiGoal.update({
      where: { id: goalId, tenantId },
      data,
    });
  }

  async deleteGoal(goalId: string, tenantId: string) {
    return this.prisma.kpiGoal.delete({
      where: { id: goalId, tenantId },
    });
  }

  async getAlerts(tenantId: string, status?: string) {
    return this.prisma.kpiAlert.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAlertSummary(tenantId: string) {
    const [open, acknowledged, resolved] = await Promise.all([
      this.prisma.kpiAlert.count({ where: { tenantId, status: 'open' } }),
      this.prisma.kpiAlert.count({ where: { tenantId, status: 'acknowledged' } }),
      this.prisma.kpiAlert.count({ where: { tenantId, status: 'resolved' } }),
    ]);

    const critical = await this.prisma.kpiAlert.count({
      where: { tenantId, status: 'open', severity: 'critical' },
    });

    return { open, acknowledged, resolved, critical, total: open + acknowledged + resolved };
  }

  async createAlert(data: {
    tenantId: string;
    branchId?: string;
    metric: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    value?: number;
    threshold?: number;
  }) {
    return this.snapshotService.createAlert(data.tenantId, {
      branchId: data.branchId,
      metric: data.metric,
      severity: data.severity,
      title: data.title,
      message: data.message,
      value: data.value,
      threshold: data.threshold,
    });
  }

  async acknowledgeAlert(alertId: string, tenantId: string) {
    return this.snapshotService.acknowledgeAlert(alertId, tenantId);
  }

  async resolveAlert(alertId: string, tenantId: string) {
    return this.snapshotService.resolveAlert(alertId, tenantId);
  }

  async getGoalProgress(tenantId: string) {
    return this.snapshotService.getGoalProgress(tenantId);
  }
}
