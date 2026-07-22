import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/create-blog-post.dto';

@ApiTags('blog-posts')
@Controller('blog-posts')
export class BlogPostsController {
  constructor(private readonly blogPostsService: BlogPostsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('blog:read')
  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('status') status?: string) {
    return this.blogPostsService.findAll(tenantId, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('blog:write')
  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateBlogPostDto) {
    return this.blogPostsService.create(tenantId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('blog:write')
  @Put(':id')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogPostsService.update(tenantId, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('blog:write')
  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.blogPostsService.remove(tenantId, id);
  }
}
