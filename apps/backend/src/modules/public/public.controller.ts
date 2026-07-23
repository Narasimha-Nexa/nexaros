import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
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

  @Get('offers/:slug')
  @ApiOperation({ summary: 'Get active offers for a tenant by slug (public)' })
  getOffers(@Param('slug') slug: string) {
    return this.publicService.getPublicOffers(slug);
  }

  @Get('announcements/:slug')
  @ApiOperation({ summary: 'Get active announcements for a tenant by slug (public)' })
  getAnnouncements(@Param('slug') slug: string) {
    return this.publicService.getPublicAnnouncements(slug);
  }

  @Get('gallery/:slug')
  @ApiOperation({ summary: 'Get gallery images for a tenant by slug (public)' })
  getGallery(@Param('slug') slug: string) {
    return this.publicService.getPublicGallery(slug);
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

  @Get('tenant/subdomain/:subdomain')
  @ApiOperation({ summary: 'Get tenant by subdomain (for *.nexaros.in routing)' })
  getTenantBySubdomain(@Param('subdomain') subdomain: string) {
    return this.publicService.getTenantBySubdomain(subdomain);
  }

  @Get('website/:slug')
  @ApiOperation({ summary: 'Get full website config (branding, menu, tables, sections) for customer-facing site' })
  getWebsiteConfig(@Param('slug') slug: string) {
    return this.publicService.getWebsiteConfig(slug);
  }

  @Get('website/subdomain/:subdomain')
  @ApiOperation({ summary: 'Get website config by subdomain (for *.nexaros.in routing)' })
  getWebsiteConfigBySubdomain(@Param('subdomain') subdomain: string) {
    return this.publicService.getWebsiteConfigBySubdomain(subdomain);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans (public)' })
  getPlans() {
    return this.publicService.getPlans();
  }

  @Post('contact')
  @ApiOperation({ summary: 'Submit a contact message (public)' })
  submitContact(
    @Body() dto: {
      name: string;
      email: string;
      message: string;
      phone?: string;
      subject?: string;
      tenantId?: string;
    },
  ) {
    return this.publicService.submitContactMessage(dto);
  }

  @Get('coupons/:slug/validate')
  @ApiOperation({ summary: 'Validate a coupon code (public)' })
  validateCoupon(
    @Param('slug') slug: string,
    @Query('code') code: string,
    @Query('orderAmount') orderAmount?: string,
  ) {
    return this.publicService.validateCoupon(slug, code, orderAmount ? parseFloat(orderAmount) : undefined);
  }

  // ─── Reservations (public) ───

  @Get('reservations/:slug/slots')
  @ApiOperation({ summary: 'Get available reservation slots (public)' })
  getAvailableSlots(@Param('slug') slug: string, @Query('date') date: string) {
    return this.publicService.getAvailableSlots(slug, date);
  }

  @Post('reservations/:slug')
  @ApiOperation({ summary: 'Create a reservation (public)' })
  createReservation(
    @Param('slug') slug: string,
    @Body() body: {
      customerName: string;
      customerPhone: string;
      date: string;
      time: string;
      guestCount: number;
      occasion?: string;
      specialRequests?: string;
    },
  ) {
    return this.publicService.createPublicReservation(slug, body);
  }

  @Get('cms/:slug/testimonials')
  @ApiOperation({ summary: 'Get testimonials for a restaurant (public)' })
  getTestimonials(@Param('slug') slug: string) {
    return this.publicService.getTestimonials(slug);
  }

  @Get('cms/:slug/faqs')
  @ApiOperation({ summary: 'Get FAQs for a restaurant (public)' })
  getFaqs(@Param('slug') slug: string) {
    return this.publicService.getFaqs(slug);
  }

  @Get('cms/:slug/blog')
  @ApiOperation({ summary: 'Get published blog posts for a restaurant (public)' })
  getBlogPosts(@Param('slug') slug: string) {
    return this.publicService.getBlogPosts(slug);
  }

  @Get('cms/:slug/events')
  @ApiOperation({ summary: 'Get events for a restaurant (public)' })
  getEvents(@Param('slug') slug: string) {
    return this.publicService.getEvents(slug);
  }

  @Get('tenants/slugs')
  @ApiOperation({ summary: 'Get all active tenant slugs for sitemap generation' })
  getTenantSlugs() {
    return this.publicService.getTenantSlugs();
  }
}
