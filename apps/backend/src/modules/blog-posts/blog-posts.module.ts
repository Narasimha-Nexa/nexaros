import { Module } from '@nestjs/common';
import { BlogPostsController } from './blog-posts.controller';
import { BlogPostsService } from './blog-posts.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventBusModule } from '../../common/event-bus/event-bus.module';

@Module({
  imports: [PrismaModule, EventBusModule],
  controllers: [BlogPostsController],
  providers: [BlogPostsService],
  exports: [BlogPostsService],
})
export class BlogPostsModule {}
