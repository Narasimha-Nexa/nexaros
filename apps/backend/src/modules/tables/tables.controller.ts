import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';
import { MergeTablesDto } from './dto/merge-tables.dto';
import { SplitTableDto } from './dto/split-table.dto';
import { BatchUpdateTableStatusDto } from './dto/batch-update-table-status.dto';

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'List tables for a branch' })
  @ApiQuery({ name: 'branchId', required: true })
  findAll(@Query('branchId') branchId: string, @CurrentTenant() tenantId: string) {
    return this.tablesService.findAll(branchId, tenantId);
  }

  @Get('floor-plan')
  @ApiOperation({ summary: 'Get floor plan with live status' })
  @ApiQuery({ name: 'branchId', required: true })
  getFloorPlan(@Query('branchId') branchId: string, @CurrentTenant() tenantId: string) {
    return this.tablesService.getFloorPlan(branchId, tenantId);
  }

  @Get('utilization')
  @ApiOperation({ summary: 'Get table utilization statistics' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'period', required: false, enum: ['today', 'week', 'month'] })
  getUtilization(
    @Query('branchId') branchId: string,
    @Query('period') period: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.tablesService.getTableUtilization(branchId, tenantId, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get table details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.tablesService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a table' })
  @ApiQuery({ name: 'branchId', required: true })
  create(@Query('branchId') branchId: string, @Body() data: CreateTableDto, @CurrentTenant() tenantId: string) {
    return this.tablesService.create(branchId, data, tenantId);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge multiple tables into one' })
  merge(@Body() data: MergeTablesDto, @CurrentTenant() tenantId: string) {
    return this.tablesService.mergeTables(data.tableIds, tenantId, {
      name: data.name,
      capacity: data.capacity,
    });
  }

  @Post(':id/split')
  @ApiOperation({ summary: 'Split a merged table back into individual tables' })
  split(@Param('id') id: string, @Body() data: SplitTableDto, @CurrentTenant() tenantId: string) {
    return this.tablesService.splitTable(id, tenantId, data.splitCount);
  }

  @Patch('batch-status')
  @ApiOperation({ summary: 'Batch update status for multiple tables' })
  batchUpdateStatus(@Body() data: BatchUpdateTableStatusDto, @CurrentTenant() tenantId: string) {
    return this.tablesService.batchUpdateStatus(data.tableIds, data.status, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update table details' })
  update(@Param('id') id: string, @Body() data: UpdateTableDto, @CurrentTenant() tenantId: string) {
    return this.tablesService.update(id, data, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update table status' })
  updateStatus(@Param('id') id: string, @Body() data: UpdateTableStatusDto, @CurrentTenant() tenantId: string) {
    return this.tablesService.updateStatus(id, data.status, tenantId);
  }

  @Patch(':id/position')
  @ApiOperation({ summary: 'Update table position on floor plan' })
  updatePosition(
    @Param('id') id: string,
    @Body() data: { posX: number; posY: number; section?: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.tablesService.updateTablePosition(id, data.posX, data.posY, data.section, tenantId);
  }

  @Patch('batch/positions')
  @ApiOperation({ summary: 'Batch update table positions' })
  batchUpdatePositions(
    @Body() data: { positions: Array<{ id: string; posX: number; posY: number; section?: string }> },
    @CurrentTenant() tenantId: string,
  ) {
    return this.tablesService.batchUpdatePositions(data.positions, tenantId);
  }

  @Post(':id/qr-code')
  @ApiOperation({ summary: 'Generate QR code for table ordering' })
  generateQrCode(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.tablesService.generateQrCode(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete table' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.tablesService.remove(id, tenantId);
  }
}
