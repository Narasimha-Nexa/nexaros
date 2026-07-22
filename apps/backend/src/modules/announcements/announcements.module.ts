import { Module } from '@nestjs/common';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsAdminController } from './announcements-admin.controller';
import { AnnouncementsService } from './announcements.service';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [EventBusModule],
  controllers: [AnnouncementsController, AnnouncementsAdminController],
  providers: [AnnouncementsService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}
