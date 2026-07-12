import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'List tables for a branch' })
  findAll(@Query('branchId') branchId: string) {
    return this.tablesService.findAll(branchId);
  }

  @Get('floor-plan')
  @ApiOperation({ summary: 'Get floor plan with live status' })
  getFloorPlan(@Query('branchId') branchId: string) {
    return this.tablesService.getFloorPlan(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get table details' })
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a table' })
  create(@Query('branchId') branchId: string, @Body() data: any) {
    return this.tablesService.create(branchId, data);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update table status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tablesService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete table' })
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
