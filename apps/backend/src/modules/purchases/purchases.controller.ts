import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @ApiOperation({ summary: 'List purchases' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.purchasesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.purchasesService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create purchase order' })
  create(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.purchasesService.create(tenantId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update purchase status' })
  updateStatus(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body('status') status: string) {
    return this.purchasesService.updateStatus(id, tenantId, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete purchase' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.purchasesService.remove(id, tenantId);
  }
}
