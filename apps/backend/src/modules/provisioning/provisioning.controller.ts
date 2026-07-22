import {
  Controller, Get, Post, Patch, Param, Body, Query, Request,
  UseGuards, Headers, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProvisioningService } from './provisioning.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import {
  CreateDraftDto, ValidateCouponDto, CreatePaymentOrderDto,
  VerifyPaymentDto, ExecuteProvisioningDto,
} from './dto/provisioning.dto';

@ApiTags('Provisioning')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
@Controller('provisioning')
export class ProvisioningController {
  constructor(private readonly provisioningService: ProvisioningService) {}

  // ── Check Owner (Step 0: Before provisioning, check if owner exists) ──
  @Post('check-owner')
  @ApiOperation({
    summary: 'Check if an owner exists by email. Returns owner + tenants if found.',
    description: 'Entry point for multi-tenant provisioning. If owner exists, the UI shows option to create new business or add branch.',
  })
  async checkOwner(@Body('email') email: string) {
    return this.provisioningService.checkOwner(email);
  }

  // ── Create Draft ──
  @Post('draft')
  @ApiOperation({ summary: 'Create or update a provisioning draft' })
  async createDraft(
    @Body() dto: CreateDraftDto,
    @Headers('x-forwarded-for') ip?: string,
    @Headers('user-agent') ua?: string,
  ) {
    return this.provisioningService.createDraft(dto, ip, ua);
  }

  // ── Update Draft ──
  @Patch('draft/:requestId')
  @ApiOperation({ summary: 'Update a provisioning draft (e.g. after failed attempt)' })
  async updateDraft(
    @Param('requestId') requestId: string,
    @Body() updates: Partial<CreateDraftDto>,
  ) {
    return this.provisioningService.updateDraft(requestId, updates);
  }

  // ── Get Plans ──
  @Get('plans')
  @ApiOperation({ summary: 'Get available plans for provisioning' })
  async getPlans() {
    return this.provisioningService.getPlans();
  }

  // ── Calculate Price ──
  @Post('calculate')
  @ApiOperation({ summary: 'Calculate price for a plan with optional coupon' })
  async calculatePrice(
    @Body() body: { planId: string; couponCode?: string; billingCycle?: string; customAmount?: number },
  ) {
    return this.provisioningService.calculatePrice(body.planId, body.couponCode, body.billingCycle, body.customAmount);
  }

  // ── Validate Coupon ──
  @Post('coupon/validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.provisioningService.validateCoupon(dto);
  }

  // ── Create Payment Order ──
  @Post('payment/create-order')
  @ApiOperation({ summary: 'Create a Razorpay payment order for provisioning' })
  async createPaymentOrder(@Body() dto: CreatePaymentOrderDto) {
    return this.provisioningService.createPaymentOrder(dto.requestId, dto.paymentProvider);
  }

  // ── Verify Payment ──
  @Post('payment/verify')
  @ApiOperation({ summary: 'Verify Razorpay payment signature' })
  async verifyPayment(@Body() dto: VerifyPaymentDto) {
    return this.provisioningService.verifyPayment(
      dto.requestId, dto.paymentOrderId, dto.paymentId, dto.paymentSignature,
    );
  }

  // ── Validate Pre-Provision ──
  @Post('validate/:requestId')
  @ApiOperation({ summary: 'Validate a provision request before payment or execution' })
  async validatePreProvision(@Param('requestId') requestId: string) {
    return this.provisioningService.validatePreProvision(requestId);
  }

  // ── Preview ──
  @Post('preview')
  @ApiOperation({ summary: 'Preview what will be provisioned before executing' })
  async previewProvisioning(@Body('requestId') requestId: string) {
    return this.provisioningService.previewProvisioning(requestId);
  }

  // ── Execute Provisioning ──
  @Post('execute')
  @ApiOperation({
    summary: 'Execute provisioning — creates tenant+branch+owner+subscription (new_business) or branch+subscription (add_branch)',
  })
  async executeProvisioning(
    @Request() req: any,
    @Body() dto: ExecuteProvisioningDto,
    @Headers('x-forwarded-for') ip?: string,
  ) {
    return this.provisioningService.executeProvisioning(dto.requestId, req.admin.id, ip);
  }

  // ── Get Progress ──
  @Get(':requestId/progress')
  @ApiOperation({ summary: 'Get real-time provisioning progress' })
  async getProgress(@Param('requestId') requestId: string) {
    return this.provisioningService.getProgress(requestId);
  }

  // ── Get by Token ──
  @Get('token/:token')
  @ApiOperation({ summary: 'Get provision request by token' })
  async getByToken(@Param('token') token: string) {
    return this.provisioningService.getByToken(token);
  }
}
