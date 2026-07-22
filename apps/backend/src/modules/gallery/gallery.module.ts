import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryAdminController } from './gallery-admin.controller';
import { GalleryService } from './gallery.service';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [EventBusModule],
  controllers: [GalleryController, GalleryAdminController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
