import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('entitlements/:tenantId')
  @ApiOperation({ summary: 'Get tenant entitlements and subscription status' })
  async getEntitlements(@Param('tenantId') tenantId: string) {
    return this.billingService.getEntitlements(tenantId);
  }

  @Post('transition')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transition subscription status' })
  async transitionStatus(
    @Body() body: { tenantId: string; status: string; reason?: string; days?: number },
  ) {
    return this.billingService.transitionStatus(body.tenantId, body.status, body);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create subscription checkout' })
  async createCheckout(
    @Body() body: { tenantId: string; planId: string; couponCode?: string },
  ) {
    return this.billingService.createCheckout(body.tenantId, body.planId, body.couponCode);
  }

  @Post('payment-promise')
  @ApiOperation({ summary: 'Create payment promise' })
  async createPaymentPromise(
    @Body() body: { tenantId: string; reason: string; expectedDate: string },
  ) {
    return this.billingService.createPaymentPromise(body.tenantId, body.reason, body.expectedDate);
  }

  @Get('payment-promises/:tenantId')
  @ApiOperation({ summary: 'Get payment promises for tenant' })
  async getPaymentPromises(@Param('tenantId') tenantId: string) {
    return this.billingService.getPaymentPromises(tenantId);
  }

  @Get('invoices/:tenantId')
  @ApiOperation({ summary: 'Get subscription invoices' })
  async getInvoices(@Param('tenantId') tenantId: string) {
    return this.billingService.getInvoices(tenantId);
  }

  @Get('payments/:tenantId')
  @ApiOperation({ summary: 'Get subscription payments' })
  async getPayments(@Param('tenantId') tenantId: string) {
    return this.billingService.getPayments(tenantId);
  }

  @Get('admin/subscriptions')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all subscriptions' })
  async getAllSubscriptions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.billingService.getAllSubscriptions(page || 1, limit || 50, status);
  }

  @Get('admin/expiring-soon')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: subscriptions expiring soon' })
  async getExpiringSoon(@Query('days') days?: number) {
    return this.billingService.getExpiringSoon(days || 7);
  }
}
