import { Module } from '@nestjs/common';
import { AggregatorGatewayController } from './aggregator-gateway.controller';
import { AggregatorGatewayService } from './aggregator-gateway.service';
import { SwiggyAdapter } from './adapters/swiggy.adapter';
import { ZomatoAdapter } from './adapters/zomato.adapter';
import { MenuSyncService } from './services/menu-sync.service';
import { ReconciliationService } from './services/reconciliation.service';
import { StatusSyncWorker } from './workers/status-sync.worker';
import { OrderIngestWorker } from './workers/order-ingest.worker';
import { PrismaModule } from '../../../prisma/prisma.module';
import { QueueModule } from '../../../common/queue/queue.module';
import { WebsocketsModule } from '../../websockets/websockets.module';
import { CommonModule } from '../common/common.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

@Module({
  imports: [PrismaModule, QueueModule, WebsocketsModule, CommonModule, MonitoringModule],
  controllers: [AggregatorGatewayController],
  providers: [
    AggregatorGatewayService,
    SwiggyAdapter,
    ZomatoAdapter,
    MenuSyncService,
    ReconciliationService,
    StatusSyncWorker,
    OrderIngestWorker,
  ],
  exports: [SwiggyAdapter, ZomatoAdapter, MenuSyncService, ReconciliationService, StatusSyncWorker],
})
export class AggregatorGatewayModule {}
