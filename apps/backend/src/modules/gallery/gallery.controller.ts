import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { GalleryService } from './gallery.service';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from './dto/create-gallery-image.dto';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('gallery:read')
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.galleryService.findAll(tenantId);
  }

  @ApiOperation({ summary: 'Get gallery images for a tenant by slug' })
  @Get('public/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.galleryService.getPublicBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('gallery:read')
  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.galleryService.findOne(tenantId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('gallery:write')
  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateGalleryImageDto) {
    return this.galleryService.create(tenantId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('gallery:write')
  @Put(':id')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateGalleryImageDto) {
    return this.galleryService.update(tenantId, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('gallery:delete')
  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.galleryService.remove(tenantId, id);
  }
}
