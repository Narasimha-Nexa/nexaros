import {
  Controller, Get, Param, Query, UseGuards, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('admin-ai')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/ai')
export class AiAdminController {
  constructor(private readonly aiService: AiService) {}

  @Get('insights')
  @ApiOperation({ summary: 'AI business insights for a tenant (admin)' })
  @ApiQuery({ name: 'tenantId', required: true, type: String })
  getInsights(@Query('tenantId') tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    return this.aiService.getInsights(tenantId);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Demand forecast for a tenant (admin)' })
  @ApiQuery({ name: 'tenantId', required: true, type: String })
  @ApiQuery({ name: 'days', required: false, type: Number })
  forecastDemand(
    @Query('tenantId') tenantId: string,
    @Query('days') days?: string,
  ) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    const parsedDays = days ? Number(days) : 7;
    if (Number.isNaN(parsedDays) || parsedDays < 1 || parsedDays > 90) {
      throw new BadRequestException('days must be between 1 and 90');
    }
    return this.aiService.forecastDemand(tenantId, parsedDays);
  }

  @Get('pairings/:menuItemId')
  @ApiOperation({ summary: 'Menu pairing suggestions for a tenant (admin)' })
  @ApiQuery({ name: 'tenantId', required: true, type: String })
  suggestPairings(
    @Query('tenantId') tenantId: string,
    @Param('menuItemId') menuItemId: string,
  ) {
    if (!tenantId) throw new BadRequestException('tenantId is required');
    return this.aiService.suggestPairings(tenantId, menuItemId);
  }
}
