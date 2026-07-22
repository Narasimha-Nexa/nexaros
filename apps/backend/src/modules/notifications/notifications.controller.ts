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
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.findAll(tenantId, user?.id, branchId, limit ? parseInt(limit) : 50);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  getUnreadCount(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(tenantId, user?.id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@CurrentTenant() tenantId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.markRead(tenantId, id, user?.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.notificationsService.markAllRead(tenantId, user?.id);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a notification (in-app, email, or SMS)' })
  send(@CurrentTenant() tenantId: string, @Body() dto: CreateNotificationDto) {
    return this.notificationsService.send(tenantId, dto);
  }

  @Post(':id/delete')
  @ApiOperation({ summary: 'Soft-delete a notification' })
  delete(@CurrentTenant() tenantId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return this.notificationsService.delete(tenantId, id, user?.id);
  }
}
