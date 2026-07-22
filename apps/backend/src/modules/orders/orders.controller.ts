import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchScopeGuard } from '../../common/guards/branch-scope.guard';
import { EntitlementsGuard } from '../../common/guards/entitlements.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchScopeGuard, EntitlementsGuard)
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
    @Query() pagination?: PaginationDto,
  ) {
    const { skip, take } = paginate(pagination?.page, pagination?.limit);
    return this.ordersService.findAll(branchId, status, skip, take);
  }

  @Get('next-number')
  @ApiOperation({ summary: 'Get next order number' })
  @ApiQuery({ name: 'branchId', required: true })
  getOrderNumber(@Query('branchId') branchId: string) {
    return this.ordersService.getOrderNumber(branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.ordersService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiQuery({ name: 'branchId', required: true })
  create(@Query('branchId') branchId: string, @Body() data: CreateOrderDto) {
    return this.ordersService.create(branchId, data);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to existing order' })
  addItem(@Param('id') id: string, @Body() data: AddItemDto, @CurrentTenant() tenantId: string) {
    return this.ordersService.addItem(id, data, tenantId);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove item from order' })
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentTenant() tenantId: string) {
    return this.ordersService.removeItem(id, itemId, tenantId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateOrderStatusDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.ordersService.updateStatus(id, data.status, data.notes, tenantId);
  }

  @Post(':id/kot')
  @ApiOperation({ summary: 'Print KOT (Kitchen Order Ticket)' })
  printKot(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.ordersService.printKot(id, tenantId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  cancel(@Param('id') id: string, @Body('notes') notes?: string, @CurrentTenant() tenantId?: string) {
    return this.ordersService.cancel(id, notes, tenantId);
  }
}
