import {
  Controller, Get, Post, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/roles.decorator';

class CreateApiKeyDto {
  name: string;
  permissions: string[];
  expiresAt?: Date;
}

@ApiTags('api-keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Create a new API key' })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(user.tenantId, user.id, dto);
  }

  @Get()
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'List all API keys' })
  list(@CurrentUser() user: any) {
    return this.apiKeysService.list(user.tenantId);
  }

  @Post(':id/revoke')
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Revoke an API key' })
  revoke(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.apiKeysService.revoke(user.tenantId, id);
  }

  @Post(':id/rotate')
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Rotate an API key' })
  rotate(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.apiKeysService.rotate(user.tenantId, id);
  }

  @Delete(':id')
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Delete an API key' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.apiKeysService.delete(user.tenantId, id);
  }
}
