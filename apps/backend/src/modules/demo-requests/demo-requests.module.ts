import { Module } from '@nestjs/common';
import { DemoRequestsService } from './demo-requests.service';
import { DemoRequestsController } from './demo-requests.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [DemoRequestsController],
  providers: [DemoRequestsService, PrismaService],
  exports: [DemoRequestsService],
})
export class DemoRequestsModule {}
