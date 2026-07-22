import { Module } from '@nestjs/common';
import { ProvisioningService } from './provisioning.service';
import { ProvisioningController } from './provisioning.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { OwnerProfileModule } from '../owner-profile/owner-profile.module';
import { BillingModule } from '../billing/billing.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [PrismaModule, OwnerProfileModule, BillingModule, WebsocketsModule, AdminModule],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
  exports: [ProvisioningService],
})
export class ProvisioningModule {}
