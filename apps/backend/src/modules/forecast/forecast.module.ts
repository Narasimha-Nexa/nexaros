import { Module } from '@nestjs/common';
import { ForecastService } from './forecast.service';
import { ForecastController } from './forecast.controller';
import { BiModule } from '../bi/bi.module';
import { BiScheduler } from '../bi/bi.scheduler';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [BiModule, PrismaModule],
  controllers: [ForecastController],
  providers: [ForecastService, BiScheduler],
  exports: [ForecastService],
})
export class ForecastModule {}
