import {
  Controller, Get, Patch, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('kitchen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

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
}
