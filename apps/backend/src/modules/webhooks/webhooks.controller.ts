import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Create a webhook' })
  create(
    @CurrentUser() user: any,
    @Body()
    body: {
      name: string;
      url: string;
      events: string[];
      secret?: string;
      headers?: Record<string, string>;
    },
  ) {
    return this.webhooksService.create(user.tenantId, body);
  }

  @Get()
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'List webhooks' })
  list(@CurrentUser() user: any) {
    return this.webhooksService.list(user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get webhook by ID' })
  getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.webhooksService.getById(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Update a webhook' })
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      url?: string;
      events?: string[];
      secret?: string | null;
      isActive?: boolean;
      headers?: Record<string, string> | null;
    },
  ) {
    return this.webhooksService.update(user.tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('settings:delete')
  @ApiOperation({ summary: 'Delete a webhook' })
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.webhooksService.delete(user.tenantId, id);
  }

  @Post(':id/retry/:deliveryId')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Retry a webhook delivery' })
  retryDelivery(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.webhooksService.retryDelivery(deliveryId);
  }

  @Get(':id/deliveries')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get paginated deliveries' })
  getDeliveries(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.webhooksService.getDeliveries(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post('test/:id')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Send a test payload' })
  async testWebhook(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const webhook = await this.webhooksService.getById(user.tenantId, id);

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    return this.webhooksService.triggerEvent(
      user.tenantId,
      'webhook.test',
      testPayload,
    );
  }
}
