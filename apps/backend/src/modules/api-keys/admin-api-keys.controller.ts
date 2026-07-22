import {
  Controller, Get, Post, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('admin-api-keys')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/api-keys')
export class AdminApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys (admin)' })
  async list(@Query('tenantId') tenantId: string) {
    return this.apiKeysService.list(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create API key (admin)' })
  async create(
    @Request() req: any,
    @Body() body: { tenantId: string; name: string; permissions: string[]; expiresAt?: string },
  ) {
    return this.apiKeysService.create(body.tenantId, req.admin.id, {
      name: body.name,
      permissions: body.permissions,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke API key (admin)' })
  async revoke(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.apiKeysService.revoke(tenantId, id);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate API key (admin)' })
  async rotate(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.apiKeysService.rotate(tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key (admin)' })
  async remove(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.apiKeysService.delete(tenantId, id);
  }
}
