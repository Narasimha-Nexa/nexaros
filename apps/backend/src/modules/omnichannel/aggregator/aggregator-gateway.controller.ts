import { Controller, Post, Headers, Body, Req, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { AggregatorGatewayService } from './aggregator-gateway.service';

/**
 * Aggregator Gateway Controller
 *
 * Enterprise-grade webhook endpoints for Swiggy and Zomato.
 *
 * HTTP Status Code Strategy (Spec §4.2 & §8):
 * - 401: Signature verification failed — reject immediately
 * - 200: Order already processed (idempotent) or synchronous completion
 * - 202: Order accepted and queued for async processing (HTTP 202 Accepted)
 * - 500: Processing failed — aggregator will retry
 */
@ApiTags('aggregator-webhooks')
@Controller('webhooks')
export class AggregatorGatewayController {
  constructor(private readonly gatewayService: AggregatorGatewayService) {}

  @Post('swiggy')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Swiggy order notification webhook' })
  async handleSwiggyWebhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    const result = await this.gatewayService.handleWebhook('swiggy', req.body as any, headers);
    return this.toResponse(result);
  }

  @Post('zomato')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Zomato order notification webhook' })
  async handleZomatoWebhook(
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    const result = await this.gatewayService.handleWebhook('zomato', req.body as any, headers);
    return this.toResponse(result);
  }

  /**
   * Convert gateway service result into the correct HTTP response.
   *
   * - accepted → HTTP 202 Accepted with simple body (async)
   * - duplicate → HTTP 200 with existing order info (idempotent)
   * - ok → HTTP 200 with order info (sync fallback)
   * - unmapped_restaurant → HTTP 200 with warning message
   */
  private toResponse(result: any): any {
    if (result.status === 'accepted') {
      throw new HttpException(
        { status: 'accepted', message: 'Order received and queued for processing' },
        HttpStatus.ACCEPTED,
      );
    }

    if (result.status === 'duplicate') {
      return {
        status: 'already_processed',
        orderId: result.orderId,
        orderNumber: result.orderNumber,
      };
    }

    if (result.status === 'unmapped_restaurant') {
      return {
        status: 'unmapped_restaurant',
        message: result.message || 'Restaurant mapping not found. Please configure channel_restaurant_mappings.',
      };
    }

    return {
      status: 'ok',
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      channel: result.channel,
    };
  }
}
