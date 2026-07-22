import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AggregatorGatewayModule } from './aggregator/aggregator-gateway.module';
import { ConversationalCommerceModule } from './conversational/conversational-commerce.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
  imports: [
    CommonModule,
    AggregatorGatewayModule,
    ConversationalCommerceModule,
    MonitoringModule,
  ],
  exports: [
    CommonModule,
    AggregatorGatewayModule,
    ConversationalCommerceModule,
  ],
})
export class OmnichannelModule {}
