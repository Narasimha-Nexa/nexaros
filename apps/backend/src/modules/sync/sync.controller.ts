import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  @ApiOperation({ summary: 'Push offline data to server' })
  async push(
    @CurrentTenant() tenantId: string,
    @Body() data: { orders?: any[]; payments?: any[] },
  ) {
    return this.syncService.pushOfflineData(tenantId, data);
  }

  @Get('pull')
  @ApiOperation({ summary: 'Pull latest data from server' })
  async pull(
    @CurrentTenant() tenantId: string,
    @Query('lastSyncAt') lastSyncAt?: string,
  ) {
    return this.syncService.pullLatestData(tenantId, lastSyncAt);
  }
}
