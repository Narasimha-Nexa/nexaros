import { Module } from '@nestjs/common';
import { OwnerProfileService } from './owner-profile.service';
import { OwnerProfileController } from './owner-profile.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OwnerProfileController],
  providers: [OwnerProfileService],
  exports: [OwnerProfileService],
})
export class OwnerProfileModule {}
