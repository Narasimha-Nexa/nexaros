import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateMembershipTierDto } from './dto/create-membership-tier.dto';
import { UpdateMembershipTierDto } from './dto/update-membership-tier.dto';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Get('customers')
  @ApiOperation({ summary: 'List customers with search and pagination' })
  @RequirePermissions('crm:read')
  getCustomers(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.crm.getCustomers(tenantId, { search, page, limit });
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer details with orders, loyalty, wallet, reviews' })
  @RequirePermissions('crm:read')
  getCustomer(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crm.getCustomer(tenantId, id);
  }

  @Post('customers')
  @ApiOperation({ summary: 'Create a new customer' })
  @RequirePermissions('crm:write')
  createCustomer(
    @CurrentTenant() tenantId: string,
    @Body() data: { name: string; phone?: string; email?: string; notes?: string; tags?: string[] },
  ) {
    return this.crm.createCustomer(tenantId, data);
  }

  @Put('customers/:id')
  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update customer details' })
  @RequirePermissions('crm:write')
  updateCustomer(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.crm.updateCustomer(tenantId, id, dto);
  }

  @Delete('customers/:id')
  @ApiOperation({ summary: 'Soft-delete a customer' })
  @RequirePermissions('crm:delete')
  deleteCustomer(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crm.deleteCustomer(tenantId, id);
  }

  @Get('loyalty/summary')
  @ApiOperation({ summary: 'Get loyalty program summary with tiers and points' })
  @RequirePermissions('crm:read')
  getLoyaltySummary(@CurrentTenant() tenantId: string) {
    return this.crm.getLoyaltySummary(tenantId);
  }

  @Post('loyalty/adjust')
  @ApiOperation({ summary: 'Adjust loyalty points for a customer' })
  @RequirePermissions('crm:write')
  adjustPoints(
    @CurrentTenant() tenantId: string,
    @Body() data: { customerId: string; points: number; description: string },
  ) {
    return this.crm.adjustLoyaltyPoints(tenantId, data.customerId, data.points, data.description);
  }

  @Get('tiers')
  @ApiOperation({ summary: 'List membership tiers' })
  @RequirePermissions('crm:read')
  getTiers(@CurrentTenant() tenantId: string) {
    return this.crm.getTiers(tenantId);
  }

  @Post('tiers')
  @ApiOperation({ summary: 'Create a membership tier' })
  @RequirePermissions('crm:write')
  createTier(@CurrentTenant() tenantId: string, @Body() dto: CreateMembershipTierDto) {
    return this.crm.createTier(tenantId, dto);
  }

  @Put('tiers/:id')
  @Patch('tiers/:id')
  @ApiOperation({ summary: 'Update a membership tier' })
  @RequirePermissions('crm:write')
  updateTier(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateMembershipTierDto) {
    return this.crm.updateTier(tenantId, id, dto);
  }

  @Delete('tiers/:id')
  @ApiOperation({ summary: 'Delete a membership tier' })
  @RequirePermissions('crm:delete')
  deleteTier(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crm.deleteTier(tenantId, id);
  }

  @Get('wallet/:customerId')
  @ApiOperation({ summary: 'Get wallet transactions for a customer' })
  @RequirePermissions('crm:read')
  getWallet(
    @CurrentTenant() tenantId: string,
    @Param('customerId') customerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.crm.getWalletTransactions(tenantId, customerId, page, limit);
  }

  @Post('wallet/topup')
  @ApiOperation({ summary: 'Top up customer wallet' })
  @RequirePermissions('crm:write')
  topUpWallet(
    @CurrentTenant() tenantId: string,
    @Body() data: { customerId: string; amount: number; description: string },
  ) {
    return this.crm.topUpWallet(tenantId, data.customerId, data.amount, data.description);
  }

  @Get('reviews')
  @ApiOperation({ summary: 'List reviews with pagination and filters' })
  @RequirePermissions('crm:read')
  getReviews(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
    @Query('published') published?: string,
  ) {
    return this.crm.getReviews(tenantId, { page, limit, rating, published: published !== undefined ? published === 'true' : undefined });
  }

  @Post('reviews/:id/reply')
  @ApiOperation({ summary: 'Reply to a customer review' })
  @RequirePermissions('crm:write')
  replyToReview(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() data: { reply: string }) {
    return this.crm.replyToReview(tenantId, id, data.reply, 'staff');
  }

  @Post('reviews/:id/toggle-publish')
  @ApiOperation({ summary: 'Toggle review published status' })
  @RequirePermissions('crm:write')
  togglePublish(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crm.toggleReviewPublish(tenantId, id);
  }

  @Get('feedback')
  @ApiOperation({ summary: 'List feedback with pagination' })
  @RequirePermissions('crm:read')
  getFeedback(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('resolved') resolved?: string,
  ) {
    return this.crm.getFeedback(tenantId, { page, limit, resolved: resolved !== undefined ? resolved === 'true' : undefined });
  }

  @Post('feedback/:id/resolve')
  @ApiOperation({ summary: 'Mark feedback as resolved' })
  @RequirePermissions('crm:write')
  resolveFeedback(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.crm.resolveFeedback(tenantId, id, 'staff');
  }
}
