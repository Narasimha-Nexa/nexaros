import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BranchScopeGuard } from '../../common/guards/branch-scope.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { DiningSessionService } from './dining-session.service';
import { GuestSessionService } from './guest-session.service';
import { GuestCartService } from './guest-cart.service';
import { SplitPaymentService } from './split-payment.service';
import { SharedItemService } from './shared-item.service';
import { CreateDiningSessionDto } from './dto/create-dining-session.dto';
import { SplitBillDto, FullPaymentDto, MultiPaymentDto } from './dto/payment.dto';
import { SplitType } from '@prisma/client';

@ApiTags('Dining Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchScopeGuard)
@Controller('dining')
export class DiningController {
  constructor(
    private sessionService: DiningSessionService,
    private guestService: GuestSessionService,
    private cartService: GuestCartService,
    private splitService: SplitPaymentService,
    private sharedItemService: SharedItemService,
  ) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new dining session' })
  createSession(@Body() dto: CreateDiningSessionDto, @CurrentTenant() tenantId: string) {
    return this.sessionService.createSession(dto, tenantId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get dining session details' })
  getSession(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.sessionService.getSession(id, tenantId);
  }

  @Get('sessions/branch/:branchId')
  @ApiOperation({ summary: 'Get active sessions for a branch' })
  getActiveSessions(@Param('branchId') branchId: string, @CurrentTenant() tenantId: string) {
    return this.sessionService.getActiveSessionsByBranch(branchId, tenantId);
  }

  @Patch('sessions/:id/status')
  @ApiOperation({ summary: 'Update session status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.sessionService.updateSessionStatus(id, status as any, tenantId);
  }

  @Post('sessions/:id/close')
  @ApiOperation({ summary: 'Close dining session' })
  closeSession(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.sessionService.closeSession(id, tenantId);
  }

  @Get('sessions/:id/bill')
  @ApiOperation({ summary: 'Get consolidated bill' })
  getBill(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.sessionService.getBill(id, tenantId);
  }

  @Get('qr/:qrCode')
  @ApiOperation({ summary: 'Resolve QR code to table and session' })
  resolveQr(@Param('qrCode') qrCode: string) {
    return this.sessionService.getSessionByQrCode(qrCode);
  }

  // ── Guest Management ──

  @Post('sessions/:id/guests')
  @ApiOperation({ summary: 'Add guest to session (staff-initiated)' })
  addGuest(
    @Param('id') sessionId: string,
    @Body() dto: { guestName?: string; guestNumber?: number },
  ) {
    return this.guestService.joinSession(sessionId, {
      guestToken: `staff_${Date.now()}`,
      guestName: dto.guestName,
      guestNumber: dto.guestNumber,
    });
  }

  @Patch('guests/:guestSessionId/leave')
  @ApiOperation({ summary: 'Remove guest from session' })
  removeGuest(@Param('guestSessionId') guestSessionId: string) {
    return this.guestService.leaveSession(guestSessionId);
  }

  // ── Cart (Staff can manage guest carts) ──

  @Get('guests/:guestSessionId/cart')
  @ApiOperation({ summary: "Get guest's cart" })
  getGuestCart(@Param('guestSessionId') guestSessionId: string) {
    return this.cartService.getCart(guestSessionId);
  }

  // ── Shared Items ──

  @Post('sessions/:id/shared')
  @ApiOperation({ summary: 'Add shared item to session' })
  addSharedItem(
    @Param('id') sessionId: string,
    @Body() dto: any,
    @CurrentTenant() tenantId: string,
  ) {
    return this.sharedItemService.addSharedItem(sessionId, dto, tenantId);
  }

  @Get('sessions/:id/shared')
  @ApiOperation({ summary: 'Get shared items for session' })
  getSharedItems(@Param('id') sessionId: string, @CurrentTenant() tenantId: string) {
    return this.sharedItemService.getSharedItems(sessionId, tenantId);
  }

  // ── Split & Payment ──

  @Post('sessions/:id/split')
  @ApiOperation({ summary: 'Calculate and apply split' })
  calculateSplit(
    @Param('id') sessionId: string,
    @Body() dto: SplitBillDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.splitService.calculateSplit(sessionId, tenantId, dto.splitType);
  }

  @Post('sessions/:id/pay')
  @ApiOperation({ summary: 'Process payment for a guest' })
  processGuestPayment(
    @Param('id') sessionId: string,
    @Body() dto: any,
    @CurrentTenant() tenantId: string,
  ) {
    return this.splitService.processGuestPayment(sessionId, dto, tenantId);
  }

  @Post('sessions/:id/pay-full')
  @ApiOperation({ summary: 'Pay the full bill' })
  processFullPayment(
    @Param('id') sessionId: string,
    @Body() dto: FullPaymentDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.splitService.processFullPayment(sessionId, dto, tenantId);
  }

  @Post('sessions/:id/pay-multi')
  @ApiOperation({ summary: 'Process multiple payment methods' })
  processMultiPayment(
    @Param('id') sessionId: string,
    @Body() dto: MultiPaymentDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.splitService.processMultiPayment(sessionId, dto, tenantId);
  }

  @Get('sessions/:id/payments')
  @ApiOperation({ summary: 'Get payment summary' })
  getPaymentSummary(@Param('id') sessionId: string, @CurrentTenant() tenantId: string) {
    return this.splitService.getPaymentSummary(sessionId, tenantId);
  }
}
