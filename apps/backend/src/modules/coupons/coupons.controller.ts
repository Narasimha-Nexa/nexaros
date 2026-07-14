import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a coupon (Admin)' })
  async create(@Body() body: any) {
    return this.couponsService.create(body);
  }

  @Get()
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all coupons' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.couponsService.findAll(page || 1, limit || 50);
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
  async update(@Param('id') id: string, @Body() body: any) {
    return this.couponsService.update(id, body);
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
  async validate(@Body() body: { code: string; tenantId: string; planSlug?: string }) {
    return this.couponsService.validate(body.code, body.tenantId, body.planSlug);
  }

  @Post('apply')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a coupon (Admin)' })
  async apply(@Body() body: { couponCode: string; tenantId: string; subscriptionId: string; amount: number }) {
    return this.couponsService.apply(body.couponCode, body.tenantId, body.subscriptionId, body.amount);
  }

  @Post('festival-campaign')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create festival campaign coupon (Admin)' })
  async createFestivalCampaign(@Body() body: { name: string; discountPercent: number; expiry: string; maxUses: number }) {
    return this.couponsService.createFestivalCampaign(body.name, body.discountPercent, body.expiry, body.maxUses);
  }
}
