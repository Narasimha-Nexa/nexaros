import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('Platform')
@Controller('platform')
export class PlatformController {
  constructor(private platformService: PlatformService) {}

  @Get('settings')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all platform settings (Admin)' })
  async getAllSettings() {
    return this.platformService.getAllSettings();
  }

  @Get('settings/:key')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a platform setting (Admin)' })
  async getSetting(@Param('key') key: string) {
    return this.platformService.getSetting(key);
  }

  @Post('settings')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a platform setting (Admin)' })
  async setSetting(@Body() body: { key: string; value: any; description?: string }) {
    return this.platformService.setSetting(body.key, body.value, body.description);
  }

  @Get('maintenance-mode')
  @ApiOperation({ summary: 'Check maintenance mode' })
  async getMaintenanceMode() {
    return this.platformService.getMaintenanceMode();
  }

  @Post('maintenance-mode')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle maintenance mode (Admin)' })
  async setMaintenanceMode(@Body() body: { enabled: boolean; message?: string }) {
    return this.platformService.setMaintenanceMode(body.enabled, body.message);
  }

  @Get('stats')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get platform-wide stats (Admin)' })
  async getPlatformStats() {
    return this.platformService.getPlatformStats();
  }
}
