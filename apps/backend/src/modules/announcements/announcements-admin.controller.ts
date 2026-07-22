import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminRolesGuard, AdminRoles } from '../../common/guards/admin-roles.guard';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/create-announcement.dto';

@ApiTags('admin-announcements')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@AdminRoles('SUPER_ADMIN')
@Controller('admin/tenants/:tenantId/announcements')
export class AnnouncementsAdminController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @ApiOperation({ summary: 'List announcements for a tenant (super admin)' })
  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.announcementsService.findAll(tenantId);
  }

  @ApiOperation({ summary: 'Get one announcement (super admin)' })
  @Get(':id')
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.announcementsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Create announcement (super admin)' })
  @Post()
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.announcementsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Update announcement (super admin)' })
  @Put(':id')
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete announcement (super admin)' })
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.announcementsService.remove(tenantId, id);
  }
}
