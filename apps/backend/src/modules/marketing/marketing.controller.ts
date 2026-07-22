import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { CampaignFilterDto } from './dto/campaign-filter.dto';

@ApiTags('Marketing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketing: MarketingService) {}

  // ── CAMPAIGNS ──

  @Get('campaigns')
  @ApiOperation({ summary: 'List all campaigns' })
  @RequirePermissions('marketing:read')
  findAllCampaigns(@CurrentTenant() tenantId: string, @Query() filter?: CampaignFilterDto) {
    return this.marketing.findAllCampaigns(tenantId, filter);
  }

  @Get('campaigns/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  @RequirePermissions('marketing:read')
  getCampaignStats(@CurrentTenant() tenantId: string) {
    return this.marketing.getCampaignStats(tenantId);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @RequirePermissions('marketing:read')
  findCampaign(@Param('id') id: string) {
    return this.marketing.findCampaign(id);
  }

  @Post('campaigns')
  @ApiOperation({ summary: 'Create a new campaign' })
  @RequirePermissions('marketing:write')
  createCampaign(@CurrentTenant() tenantId: string, @Body() dto: CreateCampaignDto) {
    return this.marketing.createCampaign(tenantId, dto);
  }

  @Patch('campaigns/:id')
  @ApiOperation({ summary: 'Update a campaign' })
  @RequirePermissions('marketing:write')
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.marketing.updateCampaign(id, dto);
  }

  @Post('campaigns/:id/launch')
  @ApiOperation({ summary: 'Launch a campaign' })
  @RequirePermissions('marketing:write')
  launchCampaign(@Param('id') id: string) {
    return this.marketing.launchCampaign(id);
  }

  @Post('campaigns/:id/cancel')
  @ApiOperation({ summary: 'Cancel a campaign' })
  @RequirePermissions('marketing:write')
  cancelCampaign(@Param('id') id: string) {
    return this.marketing.cancelCampaign(id);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Delete a campaign' })
  @RequirePermissions('marketing:delete')
  deleteCampaign(@Param('id') id: string) {
    return this.marketing.deleteCampaign(id);
  }

  // ── EMAIL TEMPLATES ──

  @Get('templates')
  @ApiOperation({ summary: 'List email templates' })
  @RequirePermissions('marketing:read')
  findAllTemplates(@CurrentTenant() tenantId: string, @Query('category') category?: string) {
    return this.marketing.findAllTemplates(tenantId, category);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get email template by ID' })
  @RequirePermissions('marketing:read')
  findTemplate(@Param('id') id: string) {
    return this.marketing.findTemplate(id);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create an email template' })
  @RequirePermissions('marketing:write')
  createTemplate(@CurrentTenant() tenantId: string, @Body() dto: CreateEmailTemplateDto) {
    return this.marketing.createTemplate(tenantId, dto);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update an email template' })
  @RequirePermissions('marketing:write')
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.marketing.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete an email template' })
  @RequirePermissions('marketing:delete')
  deleteTemplate(@Param('id') id: string) {
    return this.marketing.deleteTemplate(id);
  }

  // ── AUDIENCE SEGMENTS ──

  @Get('audiences')
  @ApiOperation({ summary: 'List audience segments' })
  @RequirePermissions('marketing:read')
  findAllAudiences(@CurrentTenant() tenantId: string) {
    return this.marketing.findAllAudiences(tenantId);
  }

  @Get('audiences/:id')
  @ApiOperation({ summary: 'Get audience segment by ID' })
  @RequirePermissions('marketing:read')
  findAudience(@Param('id') id: string) {
    return this.marketing.findAudience(id);
  }

  @Post('audiences')
  @ApiOperation({ summary: 'Create an audience segment' })
  @RequirePermissions('marketing:write')
  createAudience(@CurrentTenant() tenantId: string, @Body() dto: CreateAudienceDto) {
    return this.marketing.createAudience(tenantId, dto);
  }

  @Patch('audiences/:id')
  @ApiOperation({ summary: 'Update an audience segment' })
  @RequirePermissions('marketing:write')
  updateAudience(@Param('id') id: string, @Body() dto: UpdateAudienceDto) {
    return this.marketing.updateAudience(id, dto);
  }

  @Delete('audiences/:id')
  @ApiOperation({ summary: 'Delete an audience segment' })
  @RequirePermissions('marketing:delete')
  deleteAudience(@Param('id') id: string) {
    return this.marketing.deleteAudience(id);
  }
}
