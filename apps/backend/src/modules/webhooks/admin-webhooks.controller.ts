import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('admin-webhooks')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/webhooks')
export class AdminWebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'List webhooks (admin)' })
  async list(@Query('tenantId') tenantId: string) {
    return this.webhooksService.list(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create webhook (admin)' })
  async create(@Body() body: { tenantId: string; name: string; url: string; events: string[]; secret?: string; headers?: Record<string, string> }) {
    return this.webhooksService.create(body.tenantId, {
      name: body.name,
      url: body.url,
      events: body.events,
      secret: body.secret,
      headers: body.headers,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update webhook (admin)' })
  async update(@Query('tenantId') tenantId: string, @Param('id') id: string, @Body() body: { name?: string; url?: string; events?: string[]; isActive?: boolean }) {
    return this.webhooksService.update(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete webhook (admin)' })
  async remove(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.webhooksService.delete(tenantId, id);
  }

  @Post(':id/retry/:deliveryId')
  @ApiOperation({ summary: 'Retry failed delivery (admin)' })
  async retryDelivery(@Param('deliveryId') deliveryId: string) {
    return this.webhooksService.retryDelivery(deliveryId);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get webhook deliveries (admin)' })
  async getDeliveries(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.webhooksService.getDeliveries(id, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Post('test/:id')
  @ApiOperation({ summary: 'Send test event (admin)' })
  async testWebhook(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.webhooksService.triggerEvent(tenantId, 'test.event', { test: true, timestamp: new Date().toISOString() });
  }
}
