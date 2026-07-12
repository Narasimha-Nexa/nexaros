import {
  Controller, Get, Post, Patch,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'List inventory items' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.inventoryService.findAll(tenantId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items' })
  getLowStock(@CurrentTenant() tenantId: string) {
    return this.inventoryService.getLowStock(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.inventoryService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create inventory item' })
  create(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.inventoryService.create(tenantId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory item' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: any,
  ) {
    return this.inventoryService.update(id, tenantId, data);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Adjust stock level' })
  adjustStock(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: { quantity: number; type: string; notes?: string },
  ) {
    return this.inventoryService.adjustStock(id, tenantId, data);
  }
}
