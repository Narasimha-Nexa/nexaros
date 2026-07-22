import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelHealthService } from './channel-health.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/roles.decorator';

@ApiTags('omnichannel-monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('omnichannel')
export class ChannelHealthController {
  constructor(private readonly healthService: ChannelHealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get health status for all external channels' })
  @RequirePermissions('omnichannel:read')
  async getAllHealth() {
    return this.healthService.getAllChannelHealth();
  }

  @Get('health/:channel')
  @ApiOperation({ summary: 'Get health for a specific channel' })
  @RequirePermissions('omnichannel:read')
  async getChannelHealth(@Param('channel') channel: string) {
    return this.healthService.getChannelHealth(channel);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get omnichannel dashboard metrics' })
  @RequirePermissions('omnichannel:read')
  async getDashboard() {
    return this.healthService.getDashboardMetrics();
  }
}
