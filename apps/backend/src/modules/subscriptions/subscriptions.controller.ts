import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all subscriptions for tenant' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.findAll(tenantId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active subscription for tenant' })
  getActive(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.getActive(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.subscriptionsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/cancel a subscription' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.subscriptionsService.remove(id, tenantId);
  }
}
