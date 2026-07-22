import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [PrismaModule, WebsocketsModule],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
