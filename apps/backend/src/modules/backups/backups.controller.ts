import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BackupsService } from './backups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('backups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Post('trigger')
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Trigger a new backup' })
  triggerBackup(
    @CurrentUser() user: any,
    @Body() body?: { name?: string; tables?: string[]; type?: string },
  ) {
    return this.backupsService.triggerBackup(user.id, body);
  }

  @Get()
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'List all backups' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listBackups(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.backupsService.listBackups(page || 1, limit || 20);
  }

  @Get('stats')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get backup statistics' })
  getBackupStats() {
    return this.backupsService.getBackupStats();
  }

  @Get(':id')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get backup details' })
  getBackup(@Param('id') id: string) {
    return this.backupsService.getBackup(id);
  }

  @Delete(':id')
  @RequirePermissions('settings:create')
  @ApiOperation({ summary: 'Delete a backup' })
  deleteBackup(@Param('id') id: string) {
    return this.backupsService.deleteBackup(id);
  }
}
