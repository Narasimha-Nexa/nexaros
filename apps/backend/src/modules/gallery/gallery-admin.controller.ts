import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminRolesGuard, AdminRoles } from '../../common/guards/admin-roles.guard';
import { GalleryService } from './gallery.service';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from './dto/create-gallery-image.dto';

@ApiTags('admin-gallery')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@AdminRoles('SUPER_ADMIN')
@Controller('admin/tenants/:tenantId/gallery')
export class GalleryAdminController {
  constructor(private readonly galleryService: GalleryService) {}

  @ApiOperation({ summary: 'List gallery images for a tenant (super admin)' })
  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.galleryService.findAll(tenantId);
  }

  @ApiOperation({ summary: 'Get one gallery image (super admin)' })
  @Get(':id')
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.galleryService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Create gallery image (super admin)' })
  @Post()
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateGalleryImageDto) {
    return this.galleryService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Update gallery image (super admin)' })
  @Put(':id')
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGalleryImageDto,
  ) {
    return this.galleryService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete gallery image (super admin)' })
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.galleryService.remove(tenantId, id);
  }
}
