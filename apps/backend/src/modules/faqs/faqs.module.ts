import { Module } from '@nestjs/common';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
