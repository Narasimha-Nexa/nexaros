import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@ApiTags('reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @ApiOperation({ summary: 'List reservations with optional filters' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reservationsService.findAll(tenantId, { date, status, branchId });
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s active reservations' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.reservationsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a reservation' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reservation' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete reservation' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.reservationsService.remove(id, tenantId);
  }
}
