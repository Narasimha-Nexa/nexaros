import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { CreatePublicOrderDto } from './dto/public-order.dto';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('menu/:slug')
  @ApiOperation({ summary: 'Get restaurant menu by tenant slug (public)' })
  getMenu(@Param('slug') slug: string) {
    return this.publicService.getTenantMenu(slug);
  }

  @Get('table/qr/:qrCode')
  @ApiOperation({ summary: 'Get table info by QR code (public)' })
  getTableByQr(@Param('qrCode') qrCode: string) {
    return this.publicService.getTableByQrCode(qrCode);
  }

  @Get('table/scan/:qrCode')
  @ApiOperation({ summary: 'Get branch+table info for QR ordering (public)' })
  scanTableQr(@Param('qrCode') qrCode: string) {
    return this.publicService.getBranchByTableQr(qrCode);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Place an order from customer portal (public)' })
  createOrder(@Body() dto: CreatePublicOrderDto) {
    return this.publicService.createOrder(dto);
  }

  @Get('orders/:id/track')
  @ApiOperation({ summary: 'Track order status (public)' })
  trackOrder(@Param('id') id: string) {
    return this.publicService.trackOrder(id);
  }

  @Get('tenant/:slug')
  @ApiOperation({ summary: 'Get tenant/restaurant info by slug (public)' })
  getTenant(@Param('slug') slug: string) {
    return this.publicService.getTenantBySlug(slug);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans (public)' })
  getPlans() {
    return this.publicService.getPlans();
  }

  @Post('contact')
  @ApiOperation({ summary: 'Submit a contact message (public)' })
  submitContact(@Body() dto: { name: string; email: string; message: string }) {
    return this.publicService.submitContactMessage(dto);
  }
}
