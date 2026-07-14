import { Controller, Get, Put, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { UpdateCmsConfigDto } from './dto/update-cms-config.dto';
import { UpdateFeaturesDto } from './dto/update-features.dto';
import { UpdateSectionsDto } from './dto/update-sections.dto';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get(':tenantId')
  @ApiOperation({ summary: 'Get full CMS config for a tenant' })
  getConfig(@Param('tenantId') tenantId: string) {
    return this.cmsService.getConfig(tenantId);
  }

  @Put(':tenantId')
  @ApiOperation({ summary: 'Update full CMS config for a tenant' })
  updateConfig(@Param('tenantId') tenantId: string, @Body() dto: UpdateCmsConfigDto) {
    return this.cmsService.updateConfig(tenantId, dto);
  }

  @Patch(':tenantId/features')
  @ApiOperation({ summary: 'Update feature toggles' })
  updateFeatures(@Param('tenantId') tenantId: string, @Body() dto: UpdateFeaturesDto) {
    return this.cmsService.updateFeatures(tenantId, dto.features);
  }

  @Patch(':tenantId/sections')
  @ApiOperation({ summary: 'Update home page sections order/config' })
  updateSections(@Param('tenantId') tenantId: string, @Body() dto: UpdateSectionsDto) {
    return this.cmsService.updateHomeSections(tenantId, dto.sections);
  }

  @Patch(':tenantId/seo')
  @ApiOperation({ summary: 'Update SEO settings' })
  updateSeo(@Param('tenantId') tenantId: string, @Body() seo: Record<string, any>) {
    return this.cmsService.updateSeo(tenantId, seo);
  }

  @Post(':tenantId/publish')
  @ApiOperation({ summary: 'Publish website changes' })
  publish(@Param('tenantId') tenantId: string) {
    return this.cmsService.publishWebsite(tenantId);
  }

  @Post(':tenantId/reset')
  @ApiOperation({ summary: 'Reset CMS config to defaults' })
  reset(@Param('tenantId') tenantId: string) {
    return this.cmsService.resetToDefaults(tenantId);
  }

  @Get('public/:slug')
  @ApiOperation({ summary: 'Get public CMS config by tenant slug (for website)' })
  getPublicConfig(@Param('slug') slug: string) {
    return this.cmsService.getPublicConfig(slug);
  }
}
