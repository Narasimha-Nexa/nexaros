import { Controller, Get, Put, Patch, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UpdateCmsConfigDto } from './dto/update-cms-config.dto';

/**
 * Owner / staff scoped website management. The tenant is ALWAYS resolved from
 * the authenticated JWT — callers can never supply a tenantId. Reuses CmsService
 * (single source of truth) so owner and super-admin edits share identical
 * business logic, real-time events, cache-busting and audit behaviour.
 */
@ApiTags('cms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('website')
  @ApiOperation({ summary: 'Get own website config (owner/staff)' })
  @RequirePermissions('cms:read')
  getWebsite(@CurrentTenant() tenantId: string) {
    return this.cmsService.getConfig(tenantId);
  }

  @Put('website')
  @ApiOperation({ summary: 'Update own website config (owner/staff)' })
  @RequirePermissions('cms:write')
  updateWebsite(@CurrentTenant() tenantId: string, @Body() dto: UpdateCmsConfigDto) {
    return this.cmsService.updateConfig(tenantId, dto);
  }

  @Get('theme')
  @ApiOperation({ summary: 'Get own theme settings (owner/staff)' })
  @RequirePermissions('cms:read')
  getTheme(@CurrentTenant() tenantId: string) {
    return this.cmsService.getConfig(tenantId);
  }

  @Put('theme')
  @ApiOperation({ summary: 'Update own theme/branding (owner/staff)' })
  @RequirePermissions('cms:write')
  updateTheme(@CurrentTenant() tenantId: string, @Body() dto: UpdateCmsConfigDto) {
    return this.cmsService.updateConfig(tenantId, dto);
  }

  @Get('menu')
  @ApiOperation({ summary: 'Get own menu display config (owner/staff)' })
  @RequirePermissions('cms:read')
  getMenu(@CurrentTenant() tenantId: string) {
    return this.cmsService.getConfig(tenantId);
  }

  @Put('menu')
  @ApiOperation({ summary: 'Update own menu/home section config (owner/staff)' })
  @RequirePermissions('cms:write')
  updateMenu(@CurrentTenant() tenantId: string, @Body() dto: UpdateCmsConfigDto) {
    return this.cmsService.updateConfig(tenantId, dto);
  }

  @Patch('seo')
  @ApiOperation({ summary: 'Update SEO settings (owner/staff)' })
  @RequirePermissions('cms:write')
  updateSeo(@CurrentTenant() tenantId: string, @Body() seo: Record<string, any>) {
    return this.cmsService.updateSeo(tenantId, seo);
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publish website changes (owner/staff)' })
  @RequirePermissions('cms:write')
  @HttpCode(200)
  publish(@CurrentTenant() tenantId: string) {
    return this.cmsService.publishWebsite(tenantId);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset website config to defaults (owner/staff)' })
  @RequirePermissions('cms:write')
  @HttpCode(200)
  reset(@CurrentTenant() tenantId: string) {
    return this.cmsService.resetToDefaults(tenantId);
  }
}
