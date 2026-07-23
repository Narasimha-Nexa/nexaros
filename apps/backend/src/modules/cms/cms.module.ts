import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CmsController } from './cms.controller';
import { CmsAdminController } from './cms-admin.controller';
import { CmsService } from './cms.service';
import { SeoScoreService } from './seo-score.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule, ScheduleModule.forRoot()],
  controllers: [CmsController, CmsAdminController],
  providers: [CmsService, SeoScoreService],
  exports: [CmsService, SeoScoreService],
})
export class CmsModule {}
