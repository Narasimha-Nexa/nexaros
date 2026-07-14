import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EntitlementsService } from './entitlements.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

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
  async createPlan(@Body() body: any) {
    return this.entitlementsService.createPlan(body);
  }

  @Put('plans/:planId/entitlements')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update plan entitlements (Admin)' })
  async updatePlanEntitlements(
    @Param('planId') planId: string,
    @Body() body: { entitlements: Record<string, boolean> },
  ) {
    return this.entitlementsService.updatePlanEntitlements(planId, body.entitlements);
  }

  @Post('custom')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set custom entitlements for a tenant (Admin)' })
  async setCustomEntitlements(
    @Body() body: { tenantId: string; entitlements: Record<string, boolean> },
  ) {
    return this.entitlementsService.setCustomEntitlements(body.tenantId, body.entitlements);
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
  async toggleFeatureFlag(@Body() body: { key: string; enabled: boolean }) {
    return this.entitlementsService.toggleFeatureFlag(body.key, body.enabled);
  }

  @Post('feature-flags/tenant')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set tenant feature flag override (Admin)' })
  async setTenantFeatureFlag(
    @Body() body: { tenantId: string; featureFlagKey: string; enabled: boolean },
  ) {
    return this.entitlementsService.setTenantFeatureFlag(body.tenantId, body.featureFlagKey, body.enabled);
  }

  @Get('feature-flags/:tenantId')
  @ApiOperation({ summary: 'Get effective feature flags for a tenant' })
  async getTenantFeatureFlags(@Param('tenantId') tenantId: string) {
    return this.entitlementsService.getTenantFeatureFlags(tenantId);
  }
}
