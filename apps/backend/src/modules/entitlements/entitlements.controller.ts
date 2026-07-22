import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EntitlementsService } from './entitlements.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanEntitlementsDto } from './dto/update-plan-entitlements.dto';
import { SetCustomEntitlementsDto } from './dto/set-custom-entitlements.dto';
import { ToggleFeatureFlagDto } from './dto/toggle-feature-flag.dto';
import { SetTenantFeatureFlagDto } from './dto/set-tenant-feature-flag.dto';

@ApiTags('Entitlements')
@Controller('entitlements')
export class EntitlementsController {
  constructor(private entitlementsService: EntitlementsService) {}

  @Get('modules')
  @ApiOperation({ summary: 'List all available module keys' })
  async getModuleKeys() {
    return this.entitlementsService.getModuleKeys();
  }

  @Get('plans')
  @ApiOperation({ summary: 'List all platform plans with entitlements' })
  async getPlans() {
    return this.entitlementsService.getPlans();
  }

  @Get('plans/:slug')
  @ApiOperation({ summary: 'Get a specific plan by slug' })
  async getPlan(@Param('slug') slug: string) {
    return this.entitlementsService.getPlan(slug);
  }

  @Post('plans')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a platform plan (Admin)' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.entitlementsService.createPlan(dto);
  }

  @Put('plans/:planId/entitlements')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update plan entitlements (Admin)' })
  async updatePlanEntitlements(
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanEntitlementsDto,
  ) {
    return this.entitlementsService.updatePlanEntitlements(planId, dto.entitlements);
  }

  @Post('custom')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set custom entitlements for a tenant (Admin)' })
  async setCustomEntitlements(@Body() dto: SetCustomEntitlementsDto) {
    return this.entitlementsService.setCustomEntitlements(dto.tenantId, dto.entitlements);
  }

  @Get('feature-flags')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all feature flags (Admin)' })
  async getFeatureFlags() {
    return this.entitlementsService.getFeatureFlags();
  }

  @Post('feature-flags')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle feature flag (Admin)' })
  async toggleFeatureFlag(@Body() dto: ToggleFeatureFlagDto) {
    return this.entitlementsService.toggleFeatureFlag(dto.key, dto.enabled);
  }

  @Post('feature-flags/tenant')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set tenant feature flag override (Admin)' })
  async setTenantFeatureFlag(@Body() dto: SetTenantFeatureFlagDto) {
    return this.entitlementsService.setTenantFeatureFlag(dto.tenantId, dto.featureFlagKey, dto.enabled);
  }

  @Get('feature-flags/:tenantId')
  @ApiOperation({ summary: 'Get effective feature flags for a tenant' })
  async getTenantFeatureFlags(@Param('tenantId') tenantId: string) {
    return this.entitlementsService.getTenantFeatureFlags(tenantId);
  }
}
