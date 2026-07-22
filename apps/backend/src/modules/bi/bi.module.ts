import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BiService } from './bi.service';
import { BiController } from './bi.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule, ScheduleModule.forRoot()],
  controllers: [BiController],
  providers: [BiService],
  exports: [BiService],
})
export class BiModule {}
