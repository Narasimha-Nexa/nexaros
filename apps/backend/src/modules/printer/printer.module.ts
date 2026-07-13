import { Module } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { PrinterController } from './printer.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PrinterController],
  providers: [PrinterService],
  exports: [PrinterService],
})
export class PrinterModule {}
