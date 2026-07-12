import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { UpdateTableStatusDto } from './dto/update-table-status.dto';

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'List tables for a branch' })
  @ApiQuery({ name: 'branchId', required: true })
  findAll(@Query('branchId') branchId: string) {
    return this.tablesService.findAll(branchId);
  }

  @Get('floor-plan')
  @ApiOperation({ summary: 'Get floor plan with live status' })
  @ApiQuery({ name: 'branchId', required: true })
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
  @ApiQuery({ name: 'branchId', required: true })
  create(@Query('branchId') branchId: string, @Body() data: CreateTableDto) {
    return this.tablesService.create(branchId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update table details' })
  update(@Param('id') id: string, @Body() data: UpdateTableDto) {
    return this.tablesService.update(id, data);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update table status' })
  updateStatus(@Param('id') id: string, @Body() data: UpdateTableStatusDto) {
    return this.tablesService.updateStatus(id, data.status);
  }

  @Post(':id/qr-code')
  @ApiOperation({ summary: 'Generate QR code for table ordering' })
  generateQrCode(@Param('id') id: string) {
    return this.tablesService.generateQrCode(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete table' })
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
