import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminBiController } from './admin-bi.controller';
import { AdminAiCopilotController } from './admin-ai-copilot.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { EventBusModule } from '../../common/event-bus/event-bus.module';
import { BillingModule } from '../billing/billing.module';
import { OwnerProfileModule } from '../owner-profile/owner-profile.module';
import { BiModule } from '../bi/bi.module';
import { ForecastModule } from '../forecast/forecast.module';
import { AiChatModule } from '../ai-chat/ai-chat.module';

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin-secret-key-change-in-production';

@Module({
  imports: [
    JwtModule.register({
      secret: ADMIN_JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    EventBusModule,
    BillingModule,
    OwnerProfileModule,
    BiModule,
    ForecastModule,
    AiChatModule,
  ],
  controllers: [AdminController, AdminBiController, AdminAiCopilotController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
