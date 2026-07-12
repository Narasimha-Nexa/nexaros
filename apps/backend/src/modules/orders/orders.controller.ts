import {
  Controller, Get, Post, Patch,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List orders for a branch' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('branchId') branchId: string,
    @Query('status') status?: string,
  ) {
    return this.ordersService.findAll(branchId, status);
  }

  @Get('next-number')
  @ApiOperation({ summary: 'Get next order number' })
  @ApiQuery({ name: 'branchId', required: true })
  getOrderNumber(@Query('branchId') branchId: string) {
    return this.ordersService.getOrderNumber(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiQuery({ name: 'branchId', required: true })
  create(@Query('branchId') branchId: string, @Body() data: any) {
    return this.ordersService.create(branchId, data);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.ordersService.updateStatus(id, status, notes);
  }
}
