import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EntitlementsGuard } from '../../common/guards/entitlements.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateInventoryItemDto, UpdateInventoryItemDto, AdjustStockDto } from './dto/inventory.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EntitlementsGuard)
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
  create(@CurrentTenant() tenantId: string, @Body() data: CreateInventoryItemDto) {
    return this.inventoryService.create(tenantId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inventory item' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.update(id, tenantId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete inventory item' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.inventoryService.remove(id, tenantId);
  }

  @Post(':id/adjust')
  @ApiOperation({ summary: 'Adjust stock level' })
  adjustStock(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(id, tenantId, data);
  }
}
