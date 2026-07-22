import { Module, Global } from '@nestjs/common';
import { OrderNormalizationService } from './services/order-normalization.service';
import { IdempotencyService } from './services/idempotency.service';
import { StatusMappingService } from './services/status-mapping.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { QueueModule } from '../../../common/queue/queue.module';
import { WebsocketsModule } from '../../websockets/websockets.module';

@Global()
@Module({
  imports: [PrismaModule, QueueModule, WebsocketsModule],
  providers: [OrderNormalizationService, IdempotencyService, StatusMappingService],
  exports: [OrderNormalizationService, IdempotencyService, StatusMappingService],
})
export class CommonModule {}
