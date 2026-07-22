import { Controller, Post, Get, Body, Headers, UseGuards, Query, Request, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('auth/login')
  @ApiOperation({ summary: 'Admin login' })
  async login(
    @Body() body: { email: string; password: string },
    @Headers('x-forwarded-for') ip?: string,
    @Headers('user-agent') ua?: string,
  ) {
    return this.adminService.login(body.email, body.password, ip, ua);
  }

  @Post('auth/mfa/verify')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA code' })
  async verifyMfa(
    @Request() req: any,
    @Body() body: { code: string; token: string },
  ) {
    return this.adminService.verifyMfa(req.admin.id, body.code, body.token);
  }

  @Post('auth/mfa/enable')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable MFA for admin account' })
  async enableMfa(@Request() req: any) {
    return this.adminService.enableMfa(req.admin.id);
  }

  @Post('auth/mfa/save')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save MFA secret' })
  async saveMfa(@Request() req: any, @Body() body: { secret: string }) {
    await this.adminService.saveMfaSecret(req.admin.id, body.secret);
    return { saved: true };
  }

  @Get('auth/sessions')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active admin sessions' })
  async getSessions(@Request() req: any) {
    return this.adminService.getSessions(req.admin.id);
  }

  @Post('auth/sessions/revoke')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific admin session' })
  async revokeSession(@Body() body: { token: string }) {
    return this.adminService.revokeSession(body.token);
  }

  @Get('users')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List platform admin users' })
  async listAdminUsers(@Query('search') search = '', @Query('page') page = 1, @Query('limit') limit = 50) {
    return this.adminService.listAdminUsers(search, Number(page), Number(limit));
  }

  @Post('users')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new platform admin user' })
  async createAdminUser(@Request() req: any, @Body() body: { name: string; email: string; password: string; role?: string }, @Headers('x-forwarded-for') ip?: string) {
    return this.adminService.createAdminUser(req.admin.id, body, ip);
  }

  @Post('tenants/provision')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provision a new restaurant with owner, branch, and subscription' })
  async provisionTenant(
    @Request() req: any,
    @Body() body: {
      restaurantName: string;
      ownerName: string;
      ownerEmail: string;
      ownerPhone?: string;
      password?: string;
      address?: string;
      city?: string;
      state?: string;
      cuisineType?: string;
      planId?: string;
      gstNumber?: string;
      phone?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    },
    @Headers('x-forwarded-for') ip?: string,
  ) {
    return this.adminService.provisionTenant(req.admin.id, body, ip);
  }

  @Post('impersonate')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Impersonate a restaurant user (secure temporary session)' })
  async impersonate(
    @Request() req: any,
    @Body() body: { tenantId: string; userId: string },
    @Headers('x-forwarded-for') ip?: string,
  ) {
    return this.adminService.impersonate(req.admin.id, body.tenantId, body.userId, ip);
  }

  @Post('impersonate/exit')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exit impersonation session' })
  async exitImpersonation(
    @Request() req: any,
    @Headers('x-forwarded-for') ip?: string,
  ) {
    return this.adminService.exitImpersonation(req.admin.id, ip);
  }

  @Get('audit-logs')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('severity') severity?: string,
  ) {
    return this.adminService.getAuditLogs(page || 1, limit || 50, search, severity);
  }

  @Get('notifications')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get admin notifications' })
  async getNotifications(@Query('limit') limit?: string, @Query('unreadOnly') unreadOnly?: string) {
    return this.adminService.getNotifications(limit ? parseInt(limit) : 50, unreadOnly === 'true');
  }

  @Get('notifications/unread-count')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount() {
    return this.adminService.getUnreadNotificationCount();
  }

  @Post('notifications/:id/read')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') id: string) {
    return this.adminService.markNotificationRead(id);
  }

  @Post('notifications/read-all')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead() {
    return this.adminService.markAllNotificationsRead();
  }

  @Get('database/stats')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get database stats' })
  async getDatabaseStats() {
    return this.adminService.getDatabaseStats();
  }

  @Get('staff')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all staff across all tenants (admin)' })
  async listAllStaff(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listAllStaff(page || 1, limit || 20, search || '', role || '');
  }

  @Post('staff')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a staff member (admin)' })
  async createStaff(
    @Body() body: { name: string; email: string; phone?: string; role: string; tenantId: string; branchId?: string },
  ) {
    return this.adminService.createStaff(body);
  }

  @Get('branches')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all branches across all tenants (admin)' })
  async listAllBranches(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.listAllBranches(page || 1, limit || 20, search || '', tenantId || '', status || '');
  }

  @Get('branches/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get branch detail (admin)' })
  async getBranch(@Param('id') id: string) {
    return this.adminService.getBranch(id);
  }

  @Post('branches/:id/status')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branch status (admin)' })
  async updateBranchStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateBranchStatus(id, body.status);
  }
}
