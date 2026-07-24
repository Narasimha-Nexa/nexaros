import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { KpiService } from './kpi.service';
import { KpiController } from './kpi.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [PrismaModule, AuthModule, EventBusModule],
  controllers: [DashboardController, KpiController],
  providers: [DashboardService, AnalyticsSnapshotService, KpiService],
  exports: [DashboardService, AnalyticsSnapshotService, KpiService],
})
export class DashboardModule {}
