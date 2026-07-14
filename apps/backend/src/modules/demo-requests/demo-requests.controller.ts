import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DemoRequestsService } from './demo-requests.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('Demo Requests')
@Controller('demo-requests')
export class DemoRequestsController {
  constructor(private demoRequestsService: DemoRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a demo request (public)' })
  async create(@Body() body: any) {
    return this.demoRequestsService.create(body);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all demo requests (Admin)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.demoRequestsService.findAll(page || 1, limit || 50, status);
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get demo request details (Admin)' })
  async findOne(@Param('id') id: string) {
    return this.demoRequestsService.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update demo request status (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; assignedTo?: string; notes?: string },
  ) {
    return this.demoRequestsService.updateStatus(id, body.status, body);
  }

  @Get('admin/stats')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get demo request pipeline stats (Admin)' })
  async getStats() {
    return this.demoRequestsService.getStats();
  }
}
