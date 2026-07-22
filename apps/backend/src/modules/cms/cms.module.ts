import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsAdminController } from './cms-admin.controller';
import { CmsService } from './cms.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [CmsController, CmsAdminController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
