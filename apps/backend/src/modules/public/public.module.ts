import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { OffersModule } from '../offers/offers.module';
import { AnnouncementsModule } from '../announcements/announcements.module';
import { GalleryModule } from '../gallery/gallery.module';

@Module({
  imports: [PrismaModule, WebsocketsModule, OffersModule, AnnouncementsModule, GalleryModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
