import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { BranchScopeGuard } from '../../common/guards/branch-scope.guard';
import { CreateDeliveryPartnerDto } from './dto/create-delivery-partner.dto';
import { UpdateDeliveryPartnerDto } from './dto/update-delivery-partner.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, BranchScopeGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  // ─── Partners ───

  @Post('partners')
  @ApiOperation({ summary: 'Create a delivery partner' })
  @RequirePermissions('delivery:write')
  createPartner(@CurrentTenant() tenantId: string, @Body() dto: CreateDeliveryPartnerDto) {
    return this.deliveryService.createPartner({ ...dto, tenantId });
  }

  @Get('partners')
  @ApiOperation({ summary: 'List delivery partners' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  findAllPartners(@Query('tenantId') tenantId: string, @Query('branchId') branchId?: string) {
    return this.deliveryService.findAllPartners(tenantId, branchId);
  }

  @Get('partners/:id')
  @ApiOperation({ summary: 'Get partner details' })
  findPartner(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.deliveryService.findPartner(id, tenantId);
  }

  @Put('partners/:id')
  @ApiOperation({ summary: 'Update delivery partner' })
  updatePartner(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() dto: UpdateDeliveryPartnerDto) {
    return this.deliveryService.updatePartner(id, tenantId, dto);
  }

  @Delete('partners/:id')
  @ApiOperation({ summary: 'Deactivate delivery partner' })
  deletePartner(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.deliveryService.deletePartner(id, tenantId);
  }

  @Patch('partners/:id/location')
  @ApiOperation({ summary: 'Update partner live location' })
  updatePartnerLocation(@Param('id') id: string, @Body() body: { latitude: number; longitude: number }) {
    return this.deliveryService.updatePartnerLocation(id, body.latitude, body.longitude);
  }

  // ─── Deliveries ───

  @Post('assign')
  @ApiOperation({ summary: 'Assign a delivery to a partner' })
  @RequirePermissions('delivery:write')
  assignDelivery(@Body() body: { deliveryId: string; partnerId: string }) {
    return this.deliveryService.assignDelivery(body.deliveryId, body.partnerId);
  }

  @Post('unassign')
  @ApiOperation({ summary: 'Unassign a delivery from partner' })
  unassignDelivery(@Body() body: { deliveryId: string }) {
    return this.deliveryService.unassignDelivery(body.deliveryId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update delivery status' })
  updateDeliveryStatus(
    @Param('id') id: string,
    @Body() body: { status: string; lat?: number; lng?: number },
  ) {
    return this.deliveryService.updateDeliveryStatus(
      id,
      body.status,
      body.lat != null ? { lat: body.lat, lng: body.lng! } : undefined,
    );
  }

  @Post(':id/location')
  @ApiOperation({ summary: 'Record GPS location for a delivery' })
  recordLocation(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number; speed?: number; accuracy?: number },
  ) {
    return this.deliveryService.recordLocation(id, body.latitude, body.longitude, body.speed, body.accuracy);
  }

  // ─── Queries ───

  @Get('active')
  @ApiOperation({ summary: 'Get active deliveries' })
  @ApiQuery({ name: 'branchId', required: false })
  getActiveDeliveries(@Query('branchId') branchId?: string) {
    return this.deliveryService.getActiveDeliveries(branchId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get delivery history' })
  @ApiQuery({ name: 'branchId', required: false })
  getDeliveryHistory(
    @Query('branchId') branchId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.deliveryService.getDeliveryHistory(branchId, page || 1, limit || 20);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get delivery dashboard stats' })
  @ApiQuery({ name: 'branchId', required: false })
  getDashboardStats(@Query('branchId') branchId?: string) {
    return this.deliveryService.getDashboardStats(branchId);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get delivery by order ID' })
  findDeliveryByOrder(@Param('orderId') orderId: string) {
    return this.deliveryService.findDeliveryByOrder(orderId);
  }

  @Get(':id/locations')
  @ApiOperation({ summary: 'Get delivery GPS location history' })
  getDeliveryLocations(@Param('id') id: string) {
    return this.deliveryService.getDeliveryLocations(id);
  }

  @Get('pending-orders/:branchId')
  @ApiOperation({ summary: 'Get pending orders that need delivery assignment' })
  getPendingOrdersForDelivery(@Param('branchId') branchId: string) {
    return this.deliveryService.getPendingOrdersForDelivery(branchId);
  }

  @Post('from-order/:orderId')
  @ApiOperation({ summary: 'Create delivery record from an existing order' })
  createDeliveryFromOrder(
    @Param('orderId') orderId: string,
    @Body() body: { customerAddress?: string; customerLat?: number; customerLng?: number },
  ) {
    return this.deliveryService.createDeliveryFromOrder(orderId, body.customerAddress, body.customerLat, body.customerLng);
  }

  @Post('auto-assign')
  @ApiOperation({ summary: 'Auto-assign pending deliveries to available partners' })
  @RequirePermissions('delivery:write')
  autoAssign(@Body() body: { partnerPreference?: string }) {
    return this.deliveryService.autoAssign(body.partnerPreference);
  }
}
