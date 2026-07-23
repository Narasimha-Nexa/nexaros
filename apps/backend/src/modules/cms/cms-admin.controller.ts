import {
  Controller, Get, Put, Patch, Post, Delete, Param, Body, Query, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminRolesGuard, AdminRoles } from '../../common/guards/admin-roles.guard';
import { CmsService } from './cms.service';
import { UpdateCmsConfigDto } from './dto/update-cms-config.dto';
import { UpdateFeaturesDto } from './dto/update-features.dto';
import { UpdateSectionsDto } from './dto/update-sections.dto';

@ApiTags('admin-cms')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@AdminRoles('SUPER_ADMIN')
@Controller('admin/tenants/:tenantId/website')
export class CmsAdminController {
  constructor(private readonly cmsService: CmsService) {}

  private audit(req: any) {
    return { adminId: req.admin?.id, actorRole: req.admin?.role };
  }

  @ApiOperation({ summary: 'Get website config for a tenant (super admin)' })
  @Get()
  getConfig(@Param('tenantId') tenantId: string) {
    return this.cmsService.getConfig(tenantId);
  }

  @ApiOperation({ summary: 'Update full website config for a tenant (super admin)' })
  @Put()
  updateConfig(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateCmsConfigDto,
    @Request() req: any,
  ) {
    return this.cmsService.updateConfig(tenantId, dto, this.audit(req));
  }

  @ApiOperation({ summary: 'Update feature toggles (super admin)' })
  @Patch('features')
  updateFeatures(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateFeaturesDto,
    @Request() req: any,
  ) {
    return this.cmsService.updateFeatures(tenantId, dto.features, this.audit(req));
  }

  @ApiOperation({ summary: 'Update home page sections (super admin)' })
  @Patch('sections')
  updateSections(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateSectionsDto,
    @Request() req: any,
  ) {
    return this.cmsService.updateHomeSections(tenantId, dto.sections, this.audit(req));
  }

  @ApiOperation({ summary: 'Update SEO settings (super admin)' })
  @Patch('seo')
  updateSeo(
    @Param('tenantId') tenantId: string,
    @Body() seo: Record<string, any>,
    @Request() req: any,
  ) {
    return this.cmsService.updateSeo(tenantId, seo, this.audit(req));
  }

  @ApiOperation({ summary: 'Publish website changes (super admin)' })
  @Post('publish')
  @HttpCode(200)
  publish(@Param('tenantId') tenantId: string, @Request() req: any) {
    return this.cmsService.publishWebsite(tenantId, this.audit(req));
  }

  @ApiOperation({ summary: 'Reset website config to defaults (super admin)' })
  @Post('reset')
  @HttpCode(200)
  reset(@Param('tenantId') tenantId: string, @Request() req: any) {
    return this.cmsService.resetToDefaults(tenantId, this.audit(req));
  }

  @ApiOperation({ summary: 'Save a revision snapshot of current config' })
  @Post('revisions')
  @HttpCode(200)
  saveRevision(
    @Param('tenantId') tenantId: string,
    @Body() body: { label?: string },
    @Request() req: any,
  ) {
    return this.cmsService.saveRevision(tenantId, body.label, this.audit(req));
  }

  @ApiOperation({ summary: 'List revision history' })
  @Get('revisions')
  listRevisions(@Param('tenantId') tenantId: string) {
    return this.cmsService.listRevisions(tenantId);
  }

  @ApiOperation({ summary: 'Revert config to a previous revision' })
  @Post('revisions/:revisionId/revert')
  @HttpCode(200)
  revertRevision(
    @Param('tenantId') tenantId: string,
    @Param('revisionId') revisionId: string,
    @Request() req: any,
  ) {
    return this.cmsService.revertToRevision(tenantId, revisionId, this.audit(req));
  }

  @ApiOperation({ summary: 'Schedule website publish at a future time' })
  @Post('schedule-publish')
  @HttpCode(200)
  schedulePublish(
    @Param('tenantId') tenantId: string,
    @Body() body: { scheduledAt: string },
    @Request() req: any,
  ) {
    return this.cmsService.schedulePublish(tenantId, new Date(body.scheduledAt), this.audit(req));
  }

  @ApiOperation({ summary: 'Cancel scheduled publish' })
  @Post('cancel-scheduled-publish')
  @HttpCode(200)
  cancelScheduledPublish(
    @Param('tenantId') tenantId: string,
    @Request() req: any,
  ) {
    return this.cmsService.cancelScheduledPublish(tenantId, this.audit(req));
  }
}
