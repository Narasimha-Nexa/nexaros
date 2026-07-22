import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchScopeGuard } from '../../common/guards/branch-scope.guard';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { CreateFestivalCampaignDto } from './dto/create-festival-campaign.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  // ─── Platform Admin Endpoints ───

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a coupon (Admin)' })
  async create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all coupons' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('search') search?: string) {
    return this.couponsService.findAll(page || 1, limit || 50, search);
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon details' })
  async findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update coupon' })
  async update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Get(':id/stats')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon usage statistics' })
  async getUsageStats(@Param('id') id: string) {
    return this.couponsService.getUsageStats(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  async validate(@Body() dto: ValidateCouponDto) {
    return this.couponsService.validate(dto.code, dto.tenantId, dto.planSlug);
  }

  @Post('apply')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a coupon (Admin)' })
  async apply(@Body() dto: ApplyCouponDto) {
    return this.couponsService.apply(dto.couponCode, dto.tenantId, dto.subscriptionId, dto.amount);
  }

  @Post('festival-campaign')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create festival campaign coupon (Admin)' })
  async createFestivalCampaign(@Body() dto: CreateFestivalCampaignDto) {
    return this.couponsService.createFestivalCampaign(dto.name, dto.discountPercent, dto.expiry, dto.maxUses);
  }

  // ─── Tenant/Restaurant Scoped Endpoints ───

  @Get('restaurant')
  @UseGuards(JwtAuthGuard, BranchScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List restaurant coupons (tenant-scoped)' })
  async findTenantCoupons(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.couponsService.findAll(page || 1, limit || 50);
  }

  @Post('restaurant')
  @UseGuards(JwtAuthGuard, BranchScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a restaurant coupon (tenant-scoped)' })
  async createTenantCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Put('restaurant/:id')
  @UseGuards(JwtAuthGuard, BranchScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a restaurant coupon' })
  async updateTenantCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete('restaurant/:id')
  @UseGuards(JwtAuthGuard, BranchScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a restaurant coupon' })
  async deleteTenantCoupon(@Param('id') id: string) {
    return this.couponsService.update(id, { isActive: false });
  }

  @Get('restaurant/:id/stats')
  @UseGuards(JwtAuthGuard, BranchScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon usage statistics (tenant-scoped)' })
  async getTenantCouponStats(@Param('id') id: string) {
    return this.couponsService.getUsageStats(id);
  }

  @Get('restaurant/validate')
  @ApiOperation({ summary: 'Validate a coupon for order discount' })
  async validateOrderCoupon(
    @Query('code') code: string,
    @Query('tenantId') tenantId: string,
    @Query('orderAmount') orderAmount?: string,
  ) {
    return this.couponsService.validate(code, tenantId);
  }

  @Post('restaurant/apply')
  @UseGuards(JwtAuthGuard, BranchScopeGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply coupon to an order' })
  async applyOrderCoupon(@Body() dto: { code: string; orderId: string; tenantId?: string }) {
    return this.couponsService.validate(dto.code, dto.tenantId || 'tenant');
  }
}
