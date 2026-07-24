import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsPublicController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post('public')
  @ApiOperation({ summary: 'Public reservation creation (no auth required)' })
  createPublic(@Body() dto: CreateReservationDto) {
    if (!dto.tenantId) {
      throw new Error('tenantId is required for public reservations');
    }
    return this.reservationsService.createPublic(dto.tenantId, dto);
  }
}
