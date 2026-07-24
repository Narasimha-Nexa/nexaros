import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';

@ApiTags('Delivery')
@Controller('delivery')
export class DeliveryPublicController {
  constructor(private deliveryService: DeliveryService) {}

  @Get('track/:orderId')
  @ApiOperation({ summary: 'Public delivery tracking by order ID (no auth required)' })
  trackDelivery(@Param('orderId') orderId: string) {
    return this.deliveryService.trackDeliveryPublic(orderId);
  }
}
