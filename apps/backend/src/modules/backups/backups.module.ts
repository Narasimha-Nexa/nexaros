import { Module } from '@nestjs/common';
import { BackupsService } from './backups.service';
import { BackupsController } from './backups.controller';
import { AdminBackupsController } from './admin-backups.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BackupsController, AdminBackupsController],
  providers: [BackupsService, PrismaService],
  exports: [BackupsService],
})
export class BackupsModule {}
