import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchScopeGuard } from '../../common/guards/branch-scope.guard';
import { EntitlementsGuard } from '../../common/guards/entitlements.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('kitchen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchScopeGuard, EntitlementsGuard)
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  // ── Station Management ──

  @Get('stations')
  @ApiOperation({ summary: 'Get all kitchen stations for a branch' })
  @ApiQuery({ name: 'branchId', required: true })
  async getStations(@Query('branchId') branchId: string) {
    return this.kitchenService.getStations(branchId);
  }

  @Post('stations')
  @ApiOperation({ summary: 'Create a kitchen station' })
  async createStation(
    @Body() data: { branchId: string; name: string; displayName?: string; sortOrder?: number; maxConcurrentOrders?: number; color?: string },
    @CurrentUser() user: any,
  ) {
    return this.kitchenService.createStation({
      ...data,
      tenantId: user.tenantId,
    });
  }

  @Patch('stations/:id')
  @ApiOperation({ summary: 'Update a kitchen station' })
  async updateStation(
    @Param('id') id: string,
    @Body() data: { name?: string; displayName?: string; sortOrder?: number; isActive?: boolean; maxConcurrentOrders?: number; color?: string },
  ) {
    return this.kitchenService.updateStation(id, data);
  }

  @Delete('stations/:id')
  @ApiOperation({ summary: 'Deactivate a kitchen station' })
  async deleteStation(@Param('id') id: string) {
    return this.kitchenService.deleteStation(id);
  }

  // ── Order Queries ──

  @Get('orders')
  @ApiOperation({ summary: 'Get active kitchen orders' })
  @ApiQuery({ name: 'branchId', required: true })
  async getActiveOrders(@Query('branchId') branchId: string) {
    return this.kitchenService.getActiveOrders(branchId);
  }

  @Get('orders/completed')
  @ApiOperation({ summary: 'Get recently completed kitchen orders' })
  @ApiQuery({ name: 'branchId', required: true })
  async getCompletedOrders(@Query('branchId') branchId: string) {
    return this.kitchenService.getCompletedOrders(branchId);
  }

  @Get('orders/:id/kot')
  @ApiOperation({ summary: 'Get KOT data for reprinting' })
  async getKotData(@Param('id') id: string) {
    return this.kitchenService.getKotData(id);
  }

  // ── Status Updates ──

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status from kitchen' })
  @ApiQuery({ name: 'branchId', required: false })
  async updateOrderStatus(
    @Param('id') id: string,
    @Query('branchId') branchId: string,
    @Body('status') status: string,
  ) {
    return this.kitchenService.updateOrderStatus(id, status, branchId);
  }

  @Patch('orders/:id/items/:itemId')
  @ApiOperation({ summary: 'Update individual item status' })
  async updateItemStatus(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: string,
  ) {
    return this.kitchenService.updateItemStatus(orderId, itemId, status);
  }

  // ── Chef Assignment ──

  @Patch('orders/:id/assign')
  @ApiOperation({ summary: 'Assign a chef to an order' })
  async assignChef(
    @Param('id') id: string,
    @Body() data: { chefId: string; chefName: string },
  ) {
    return this.kitchenService.assignChef(id, data.chefId, data.chefName);
  }

  @Patch('orders/:id/priority')
  @ApiOperation({ summary: 'Update order priority' })
  async updatePriority(
    @Param('id') id: string,
    @Body('priority') priority: string,
  ) {
    return this.kitchenService.updatePriority(id, priority);
  }
}
