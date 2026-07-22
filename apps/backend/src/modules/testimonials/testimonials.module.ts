import { Module } from '@nestjs/common';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
