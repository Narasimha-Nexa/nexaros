import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/create-blog-post.dto';

@Injectable()
export class BlogPostsService {
  private readonly logger = new Logger(BlogPostsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async findAll(tenantId: string, status?: string) {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };
    if (status) where.status = status;
    return this.prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.blogPost.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Blog post not found');
    return item;
  }

  async create(tenantId: string, dto: CreateBlogPostDto) {
    const item = await this.prisma.blogPost.create({
      data: {
        tenantId,
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        excerpt: dto.excerpt,
        coverImage: dto.coverImage,
        author: dto.author,
        tags: dto.tags ?? [],
        status: dto.status ?? 'DRAFT',
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
      },
    });
    await this.afterMutation(tenantId, 'blog:created', { blogPostId: item.id });
    return item;
  }

  async update(tenantId: string, id: string, dto: UpdateBlogPostDto) {
    await this.findOne(tenantId, id);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt;
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.author !== undefined) data.author = dto.author;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.publishedAt !== undefined) data.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;

    const item = await this.prisma.blogPost.update({ where: { id }, data });
    await this.afterMutation(tenantId, 'blog:updated', { blogPostId: item.id });
    return item;
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.blogPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.afterMutation(tenantId, 'blog:deleted', { blogPostId: id });
    return { success: true, id };
  }

  private async afterMutation(tenantId: string, event: string, payload: Record<string, unknown>) {
    try {
      this.eventBus.emitToTenant(tenantId, event, payload);
      this.eventBus.emitToTenantPublicBySlug('', event, payload);
    } catch {}
  }
}
