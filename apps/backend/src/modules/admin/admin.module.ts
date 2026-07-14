import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';

const ADMIN_JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production';

@Module({
  imports: [
    JwtModule.register({
      secret: ADMIN_JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}
