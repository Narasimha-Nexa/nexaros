import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats (today\'s orders, revenue, occupancy, alerts)' })
  getStats(@Query() dto: DashboardFilterDto) {
    return this.dashboardService.getStats(dto.branchId);
  }

  @Get('recent-orders')
  @ApiOperation({ summary: 'Get recent orders for dashboard widget' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getRecentOrders(
    @Query('branchId') branchId?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    return this.dashboardService.getRecentOrders(branchId, limit);
  }
}
