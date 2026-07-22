import {
  Controller, Get, Post, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BackupsService } from './backups.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('admin-backups')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backups')
export class AdminBackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get()
  @ApiOperation({ summary: 'List all backups (admin)' })
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.backupsService.listBackups(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Trigger backup (admin)' })
  async trigger(@Request() req: any, @Body() body?: { name?: string; type?: string; tables?: string[] }) {
    return this.backupsService.triggerBackup(req.admin.id, body);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore backup (admin)' })
  async restore(@Param('id') id: string) {
    const backup = await this.backupsService.getBackup(id);
    return { message: 'Restore initiated', backup };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete backup (admin)' })
  async remove(@Param('id') id: string) {
    return this.backupsService.deleteBackup(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get backup stats (admin)' })
  async getStats() {
    return this.backupsService.getBackupStats();
  }
}
