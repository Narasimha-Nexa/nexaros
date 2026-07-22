import {
  Controller, Get, Post, Param,
  Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchScopeGuard } from '../../common/guards/branch-scope.guard';
import { EntitlementsGuard } from '../../common/guards/entitlements.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { ClosePosOrderDto } from './dto/close-pos-order.dto';

@ApiTags('pos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchScopeGuard, EntitlementsGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('menu')
  @ApiOperation({ summary: 'Get menu for POS — categories with items, variants, add-ons' })
  @ApiQuery({ name: 'branchId', required: true })
  getMenu(@Query('branchId') branchId: string) {
    return this.posService.getMenu(branchId);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Create a POS order with items in one call' })
  @ApiQuery({ name: 'branchId', required: true })
  createOrder(
    @Query('branchId') branchId: string,
    @CurrentUser() user: any,
    @Body() dto: CreatePosOrderDto,
  ) {
    return this.posService.createOrder(branchId, user?.staffId, dto);
  }

  @Post('orders/:id/close')
  @ApiOperation({ summary: 'Close a POS order — process payment and complete' })
  @ApiQuery({ name: 'branchId', required: true })
  closeOrder(
    @Param('id') id: string,
    @Query('branchId') branchId: string,
    @Body() dto: ClosePosOrderDto,
  ) {
    return this.posService.closeOrder(id, branchId, dto);
  }
}
