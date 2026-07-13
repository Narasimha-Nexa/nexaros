import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { SuggestPairingsDto, ForecastDemandDto } from './dto/suggest-pairings.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('pairings/:menuItemId')
  @ApiOperation({ summary: 'Suggest menu item pairings based on order history' })
  suggestPairings(
    @CurrentTenant() tenantId: string,
    @Param() params: SuggestPairingsDto,
  ) {
    return this.aiService.suggestPairings(tenantId, params.menuItemId);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Demand forecasting based on historical order patterns' })
  forecastDemand(
    @CurrentTenant() tenantId: string,
    @Query() query: ForecastDemandDto,
  ) {
    return this.aiService.forecastDemand(tenantId, query.days ?? 7);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Generate business insights from order data' })
  getInsights(@CurrentTenant() tenantId: string) {
    return this.aiService.getInsights(tenantId);
  }
}
