import { Controller, Get, Post, Param, Query, Headers, Body, Req, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { ConversationalCommerceService } from './conversational-commerce.service';

@ApiTags('conversational-webhooks')
@Controller('webhooks')
export class ConversationalCommerceController {
  constructor(private readonly commerceService: ConversationalCommerceService) {}

  /**
   * WhatsApp Cloud API webhook verification endpoint.
   * Meta sends a GET request during webhook setup.
   */
  @Get('whatsapp')
  @ApiExcludeEndpoint()
  verifyWhatsAppWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    if (mode === 'subscribe' && this.commerceService.verifyWhatsAppChallenge(token)) {
      return challenge;
    }
    throw new HttpException('Verification failed', HttpStatus.FORBIDDEN);
  }

  /**
   * WhatsApp Cloud API inbound message webhook.
   */
  @Post('whatsapp')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleWhatsAppWebhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    return this.commerceService.handleIncoming('whatsapp', body, headers);
  }

  /**
   * Instagram Messaging API webhook verification.
   */
  @Get('instagram')
  @ApiExcludeEndpoint()
  verifyInstagramWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    if (mode === 'subscribe' && this.commerceService.verifyInstagramChallenge(token)) {
      return challenge;
    }
    throw new HttpException('Verification failed', HttpStatus.FORBIDDEN);
  }

  /**
   * Instagram Messaging API inbound message webhook.
   */
  @Post('instagram')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleInstagramWebhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    return this.commerceService.handleIncoming('instagram', body, headers);
  }

  /**
   * Facebook Messenger Platform webhook verification.
   */
  @Get('facebook')
  @ApiExcludeEndpoint()
  verifyFacebookWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    if (mode === 'subscribe' && this.commerceService.verifyFacebookChallenge(token)) {
      return challenge;
    }
    throw new HttpException('Verification failed', HttpStatus.FORBIDDEN);
  }

  /**
   * Facebook Messenger Platform inbound message webhook.
   */
  @Post('facebook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleFacebookWebhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    return this.commerceService.handleIncoming('facebook', body, headers);
  }
}
