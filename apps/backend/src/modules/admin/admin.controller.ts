import { Controller, Post, Get, Body, Headers, UseGuards, Query, Request } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Revoke a session' })
  async revokeSession(@Body() body: { token: string }) {
    return this.adminService.revokeSession(body.token);
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
    },
    @Headers('x-forwarded-for') ip?: string,
  ) {
    return this.adminService.provisionTenant(req.admin.id, body, ip);
  }

  @Get('audit-logs')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAuditLogs(page || 1, limit || 50);
  }
}
