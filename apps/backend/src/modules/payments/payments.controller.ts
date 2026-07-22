import {
  Controller, Get, Post, Patch,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchScopeGuard } from '../../common/guards/branch-scope.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchScopeGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('orders/:orderId')
  @ApiOperation({ summary: 'Process payment for an order' })
  createPayment(
    @Param('orderId') orderId: string,
    @Body() data: CreatePaymentDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.paymentsService.createPayment(orderId, data, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'List payments for a branch' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'orderId', required: false })
  getPayments(
    @Query('branchId') branchId: string,
    @CurrentTenant() tenantId: string,
    @Query('orderId') orderId?: string,
  ) {
    return this.paymentsService.getPayments(branchId, tenantId, orderId);
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Get payments for a specific order' })
  getOrderPayments(@Param('orderId') orderId: string, @CurrentTenant() tenantId: string) {
    return this.paymentsService.getOrderPayments(orderId, tenantId);
  }

  @Patch(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  refundPayment(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.paymentsService.refundPayment(id, tenantId);
  }
}
