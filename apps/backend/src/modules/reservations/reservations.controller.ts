import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@ApiTags('reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({ summary: 'List reservations with pagination and filters' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reservationsService.findAll(tenantId, {
      date, status, branchId, search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's active reservations" })
  getToday(@CurrentTenant() tenantId: string) {
    return this.reservationsService.getTodayReservations(tenantId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming reservations' })
  getUpcoming(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reservationsService.getUpcomingReservations(tenantId, limit ? parseInt(limit) : 10);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get reservation statistics' })
  @ApiQuery({ name: 'branchId', required: false })
  getStats(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reservationsService.getStats(tenantId, branchId);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check table availability for a date/guest count' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'guestCount', required: true })
  getAvailability(
    @CurrentTenant() tenantId: string,
    @Query('branchId') branchId: string,
    @Query('date') date: string,
    @Query('guestCount') guestCount: string,
  ) {
    return this.reservationsService.getAvailability(tenantId, branchId, date, parseInt(guestCount) || 2);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.reservationsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a reservation' })
  @RequirePermissions('reservations:write')
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateReservationDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.reservationsService.create(tenantId, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reservation' })
  @RequirePermissions('reservations:write')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateReservationDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.reservationsService.update(id, tenantId, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel reservation' })
  @RequirePermissions('reservations:delete')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.reservationsService.remove(id, tenantId, userId);
  }
}
