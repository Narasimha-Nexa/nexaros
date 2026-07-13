import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateNotificationDto } from './dto/create-notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(tenantId, branchId, limit ? parseInt(limit) : 50);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentTenant() tenantId: string, @CurrentUser() userId: string) {
    return this.notificationsService.getUnreadCount(tenantId, userId);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a notification (in-app, email, or SMS)' })
  send(@CurrentTenant() tenantId: string, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.send(tenantId, dto);
  }
}
