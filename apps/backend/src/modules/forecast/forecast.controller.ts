import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ForecastService } from './forecast.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ForecastQueryDto } from '../bi/dto';

@ApiTags('forecast')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bi/forecast')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue forecast' })
  revenue(@CurrentTenant() tenantId: string, @Query() dto: ForecastQueryDto) {
    return this.forecastService.revenue(tenantId, dto);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Order forecast' })
  orders(@CurrentTenant() tenantId: string, @Query() dto: ForecastQueryDto) {
    return this.forecastService.orders(tenantId, dto);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory depletion forecast' })
  inventory(@CurrentTenant() tenantId: string, @Query() dto: ForecastQueryDto) {
    return this.forecastService.inventory(tenantId, dto);
  }

  @Get('staffing')
  @ApiOperation({ summary: 'Staffing demand forecast' })
  staffing(@CurrentTenant() tenantId: string, @Query() dto: ForecastQueryDto) {
    return this.forecastService.staffing(tenantId, dto);
  }
}
