import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DiningSessionService } from './dining-session.service';
import { GuestSessionService } from './guest-session.service';
import { GuestCartService } from './guest-cart.service';
import { SplitPaymentService } from './split-payment.service';
import { SharedItemService } from './shared-item.service';
import { JoinDiningSessionDto } from './dto/join-dining-session.dto';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { ProcessPaymentDto } from './dto/payment.dto';

@ApiTags('Public Dining')
@Controller('public/dining')
export class PublicDiningController {
  constructor(
    private sessionService: DiningSessionService,
    private guestService: GuestSessionService,
    private cartService: GuestCartService,
    private splitService: SplitPaymentService,
    private sharedItemService: SharedItemService,
  ) {}

  @Get('qr/:qrCode')
  @ApiOperation({ summary: 'Scan QR code → get table info and active session' })
  scanQr(@Param('qrCode') qrCode: string) {
    return this.sessionService.getSessionByQrCode(qrCode);
  }

  @Post('sessions/:sessionId/join')
  @ApiOperation({ summary: 'Join a dining session as a guest' })
  joinSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: JoinDiningSessionDto,
  ) {
    return this.guestService.joinSession(sessionId, dto);
  }

  @Get('guest/:guestToken')
  @ApiOperation({ summary: 'Get guest session by token' })
  getGuestSession(@Param('guestToken') guestToken: string) {
    return this.guestService.getGuestSession(guestToken);
  }

  @Patch('guest/:guestToken/profile')
  @ApiOperation({ summary: 'Update guest profile (name, avatar)' })
  updateGuestProfile(
    @Param('guestToken') guestToken: string,
    @Body() dto: { guestName?: string; avatarColor?: string },
  ) {
    return this.guestService.updateGuestProfile(guestToken, dto);
  }

  @Patch('guest/:guestToken/touch')
  @ApiOperation({ summary: 'Touch guest activity (keep alive)' })
  touchActivity(@Param('guestToken') guestToken: string) {
    return this.guestService.touchActivity(guestToken);
  }

  // ── Cart ──

  @Get('guest/:guestSessionId/cart')
  @ApiOperation({ summary: "Get guest's cart" })
  getCart(@Param('guestSessionId') guestSessionId: string) {
    return this.cartService.getCart(guestSessionId);
  }

  @Post('guest/:guestSessionId/cart')
  @ApiOperation({ summary: 'Add item to guest cart' })
  addToCart(
    @Param('guestSessionId') guestSessionId: string,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addToCart(guestSessionId, dto);
  }

  @Patch('guest/:guestSessionId/cart/:cartItemId')
  @ApiOperation({ summary: 'Update cart item quantity/notes' })
  updateCartItem(
    @Param('guestSessionId') guestSessionId: string,
    @Param('cartItemId') cartItemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(guestSessionId, cartItemId, dto);
  }

  @Patch('guest/:guestSessionId/cart/:cartItemId/remove')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeFromCart(
    @Param('guestSessionId') guestSessionId: string,
    @Param('cartItemId') cartItemId: string,
  ) {
    return this.cartService.removeFromCart(guestSessionId, cartItemId);
  }

  @Post('guest/:guestSessionId/order')
  @ApiOperation({ summary: 'Place order from cart' })
  placeOrder(@Param('guestSessionId') guestSessionId: string) {
    return this.cartService.placeOrder(guestSessionId);
  }

  // ── Session Info ──

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get dining session info (public)' })
  getSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.getSessionByCode(sessionId);
  }

  @Get('sessions/:sessionId/bill')
  @ApiOperation({ summary: 'Get live bill for session' })
  getBill(@Param('sessionId') sessionId: string) {
    return this.splitService.getPaymentSummary(sessionId, '');
  }

  @Get('sessions/:sessionId/shared')
  @ApiOperation({ summary: 'Get shared items' })
  getSharedItems(@Param('sessionId') sessionId: string) {
    return this.sharedItemService.getSharedItems(sessionId, '');
  }

  // ── Payment ──

  @Post('sessions/:sessionId/pay')
  @ApiOperation({ summary: 'Guest pays their share' })
  processGuestPayment(
    @Param('sessionId') sessionId: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.splitService.processGuestPayment(sessionId, dto, '');
  }
}
