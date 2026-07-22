import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AggregatorGatewayService } from './aggregator-gateway.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { OrderNormalizationService } from '../common/services/order-normalization.service';
import { IdempotencyService } from '../common/services/idempotency.service';
import { DeadLetterService } from '../monitoring/dead-letter.service';
import { StatusMappingService } from '../common/services/status-mapping.service';
import { SwiggyAdapter } from './adapters/swiggy.adapter';
import { ZomatoAdapter } from './adapters/zomato.adapter';

describe('AggregatorGatewayService', () => {
  let service: AggregatorGatewayService;
  let prisma: jest.Mocked<PrismaService>;
  let orderNormalization: jest.Mocked<OrderNormalizationService>;
  let idempotency: jest.Mocked<IdempotencyService>;
  let deadLetter: jest.Mocked<DeadLetterService>;

  const mockSwiggyPayload = {
    order_id: 'swiggy-123',
    restaurant_id: 'swiggy-rest-1',
    items: [{ id: 'item-1', name: 'Butter Chicken', quantity: 2, price: 250 }],
    customer: { name: 'John', phone: '+919999999999' },
    total: 550,
    payment_status: 'paid',
  };

  const mockZomatoPayload = {
    order_id: 'zomato-456',
    res_id: 'zomato-rest-1',
    items: [{ id: 'item-2', name: 'Naan', quantity: 3, price: 40 }],
    customer: { name: 'Jane', phone: '+918888888888' },
    total: 120,
    payment_status: 'paid',
  };

  const mockCanonicalOrder = {
    idempotencyKey: 'swiggy:swiggy-123',
    channel: 'swiggy',
    channelOrderId: 'swiggy-123',
    tenantId: '',
    branchId: '',
    orderType: 'delivery',
    customer: { name: 'John', phone: '+919999999999' },
    items: [{ menuItemId: '', name: 'Butter Chicken', quantity: 2, unitPrice: 250 }],
    pricing: { subtotal: 500, taxAmount: 50, grandTotal: 550 },
    payment: { status: 'paid', method: 'prepaid' },
    rawPayload: mockSwiggyPayload,
  };

  const mockMapping = {
    id: 'map-1',
    internalBranchId: 'branch-1',
    channel: 'SWIGGY',
    externalRestaurantId: 'swiggy-rest-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    branch: { tenantId: 'tenant-1' },
  };

  const mockAdapter = {
    channel: 'swiggy',
    verifyWebhookSignature: jest.fn(),
    normalizeOrder: jest.fn(),
    pushStatus: jest.fn(),
    healthCheck: jest.fn(),
  };

  const mockZomatoAdapter = {
    channel: 'zomato',
    verifyWebhookSignature: jest.fn(),
    normalizeOrder: jest.fn(),
    pushStatus: jest.fn(),
    healthCheck: jest.fn(),
  };

  const mockPrisma = {
    channelRestaurantMapping: {
      findFirst: jest.fn(),
    },
    channelItemMapping: {
      findFirst: jest.fn(),
    },
  };

  const mockOrderNormalization = {
    acknowledge: jest.fn(),
  };

  const mockIdempotency = {
    claim: jest.fn(),
    release: jest.fn(),
  };

  const mockDeadLetter = {
    sendToDeadLetter: jest.fn(),
  };

  const mockStatusMapping = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset adapter mocks
    mockAdapter.verifyWebhookSignature.mockReset();
    mockAdapter.normalizeOrder.mockReset();
    mockZomatoAdapter.verifyWebhookSignature.mockReset();
    mockZomatoAdapter.normalizeOrder.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AggregatorGatewayService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SwiggyAdapter, useValue: mockAdapter },
        { provide: ZomatoAdapter, useValue: mockZomatoAdapter },
        { provide: OrderNormalizationService, useValue: mockOrderNormalization },
        { provide: IdempotencyService, useValue: mockIdempotency },
        { provide: DeadLetterService, useValue: mockDeadLetter },
        { provide: StatusMappingService, useValue: mockStatusMapping },
      ],
    }).compile();

    service = module.get<AggregatorGatewayService>(AggregatorGatewayService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    orderNormalization = module.get(OrderNormalizationService) as jest.Mocked<OrderNormalizationService>;
    idempotency = module.get(IdempotencyService) as jest.Mocked<IdempotencyService>;
    deadLetter = module.get(DeadLetterService) as jest.Mocked<DeadLetterService>;
  });

  // ── handleWebhook ──

  describe('handleWebhook', () => {
    describe('Swiggy', () => {
      it('should process a valid Swiggy webhook successfully', async () => {
        mockAdapter.verifyWebhookSignature.mockReturnValue(true);
        mockAdapter.normalizeOrder.mockReturnValue(mockCanonicalOrder);
        mockIdempotency.claim.mockResolvedValue(true);
        mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
        mockOrderNormalization.acknowledge.mockResolvedValue({
          status: 'ok',
          orderId: 'order-1',
          orderNumber: 1001,
        });

        const result = await service.handleWebhook(
          'swiggy',
          mockSwiggyPayload,
          { 'x-swiggy-signature': 'valid-sig' },
        );

        expect(result).toBeDefined();
        expect(result.status).toBe('ok');
        expect(result.orderId).toBe('order-1');
        expect(result.orderNumber).toBe(1001);

        expect(mockAdapter.verifyWebhookSignature).toHaveBeenCalled();
        expect(mockAdapter.normalizeOrder).toHaveBeenCalledWith(mockSwiggyPayload);
        expect(mockIdempotency.claim).toHaveBeenCalledWith('swiggy:swiggy-123');
        expect(mockPrisma.channelRestaurantMapping.findFirst).toHaveBeenCalledWith({
          where: {
            channel: 'SWIGGY',
            externalRestaurantId: 'swiggy-rest-1',
            isActive: true,
            deletedAt: null,
          },
          include: { branch: { select: { tenantId: true } } },
        });
        expect(mockOrderNormalization.acknowledge).toHaveBeenCalled();
      });

      it('should return duplicate status when idempotency check fails', async () => {
        mockAdapter.verifyWebhookSignature.mockReturnValue(true);
        mockAdapter.normalizeOrder.mockReturnValue(mockCanonicalOrder);
        mockIdempotency.claim.mockResolvedValue(false);

        const result = await service.handleWebhook(
          'swiggy',
          mockSwiggyPayload,
          { 'x-swiggy-signature': 'valid-sig' },
        );

        expect(result.status).toBe('already_processed');
        expect(mockOrderNormalization.acknowledge).not.toHaveBeenCalled();
      });

      it('should return unmapped_restaurant when no mapping exists', async () => {
        mockAdapter.verifyWebhookSignature.mockReturnValue(true);
        mockAdapter.normalizeOrder.mockReturnValue(mockCanonicalOrder);
        mockIdempotency.claim.mockResolvedValue(true);
        mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(null);

        const result = await service.handleWebhook(
          'swiggy',
          mockSwiggyPayload,
          { 'x-swiggy-signature': 'valid-sig' },
        );

        expect(result.status).toBe('unmapped_restaurant');
        expect(mockIdempotency.release).toHaveBeenCalled();
        expect(mockDeadLetter.sendToDeadLetter).toHaveBeenCalledWith(
          'swiggy', 'Unmappable restaurant ID', mockSwiggyPayload,
        );
      });

      it('should reject with 401 when signature verification fails', async () => {
        mockAdapter.verifyWebhookSignature.mockReturnValue(false);

        await expect(
          service.handleWebhook('swiggy', mockSwiggyPayload, { 'x-swiggy-signature': 'bad-sig' }),
        ).rejects.toThrow(HttpException);

        try {
          await service.handleWebhook('swiggy', mockSwiggyPayload, { 'x-swiggy-signature': 'bad-sig' });
        } catch (e: any) {
          expect(e.getStatus()).toBe(401);
        }
      });

      it('should route to dead letter on unexpected errors', async () => {
        mockAdapter.verifyWebhookSignature.mockReturnValue(true);
        mockAdapter.normalizeOrder.mockImplementation(() => {
          throw new Error('Unexpected normalization error');
        });

        await expect(
          service.handleWebhook('swiggy', mockSwiggyPayload, { 'x-swiggy-signature': 'valid-sig' }),
        ).rejects.toThrow(HttpException);

        expect(mockDeadLetter.sendToDeadLetter).toHaveBeenCalled();
      });
    });

    describe('Zomato', () => {
      it('should process a valid Zomato webhook successfully', async () => {
        mockZomatoAdapter.verifyWebhookSignature.mockReturnValue(true);
        mockZomatoAdapter.normalizeOrder.mockReturnValue({
          ...mockCanonicalOrder,
          idempotencyKey: 'zomato:zomato-456',
          channel: 'zomato',
          channelOrderId: 'zomato-456',
        });
        mockIdempotency.claim.mockResolvedValue(true);
        mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue({
          ...mockMapping,
          channel: 'ZOMATO',
          externalRestaurantId: 'zomato-rest-1',
        });
        mockOrderNormalization.acknowledge.mockResolvedValue({
          status: 'ok',
          orderId: 'order-2',
          orderNumber: 1002,
        });

        const result = await service.handleWebhook(
          'zomato',
          mockZomatoPayload,
          { 'x-zomato-signature': 'valid-sig' },
        );

        expect(result).toBeDefined();
        expect(result.status).toBe('ok');
        expect(result.orderId).toBe('order-2');
        expect(result.orderNumber).toBe(1002);

        expect(mockZomatoAdapter.verifyWebhookSignature).toHaveBeenCalled();
        expect(mockZomatoAdapter.normalizeOrder).toHaveBeenCalledWith(mockZomatoPayload);
      });

      it('should use res_id for Zomato restaurant mapping lookup', async () => {
        mockZomatoAdapter.verifyWebhookSignature.mockReturnValue(true);
        mockZomatoAdapter.normalizeOrder.mockReturnValue({
          ...mockCanonicalOrder,
          idempotencyKey: 'zomato:zomato-456',
          channel: 'zomato',
          channelOrderId: 'zomato-456',
        });
        mockIdempotency.claim.mockResolvedValue(true);
        mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue({
          ...mockMapping,
          channel: 'ZOMATO',
          externalRestaurantId: 'zomato-rest-1',
        });
        mockOrderNormalization.acknowledge.mockResolvedValue({
          status: 'ok', orderId: 'order-2', orderNumber: 1002,
        });

        await service.handleWebhook('zomato', mockZomatoPayload, { 'x-zomato-signature': 'valid-sig' });

        expect(mockPrisma.channelRestaurantMapping.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              externalRestaurantId: 'zomato-rest-1',
            }),
          }),
        );
      });
    });

    describe('Edge cases', () => {
      it('should throw BadRequest for unknown channel', async () => {
        await expect(
          service.handleWebhook('unknown', {}, {}),
        ).rejects.toThrow(HttpException);
      });

      it('should handle async accepted response from acknowledge', async () => {
        mockAdapter.verifyWebhookSignature.mockReturnValue(true);
        mockAdapter.normalizeOrder.mockReturnValue(mockCanonicalOrder);
        mockIdempotency.claim.mockResolvedValue(true);
        mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
        mockOrderNormalization.acknowledge.mockResolvedValue({
          status: 'accepted',
        });

        const result = await service.handleWebhook(
          'swiggy',
          mockSwiggyPayload,
          { 'x-swiggy-signature': 'valid-sig' },
        );

        expect(result.status).toBe('accepted');
        expect(result.message).toBe('Order received and queued for processing');
      });

      it('should handle missing restaurant_id in payload', async () => {
        const payloadWithoutRestaurant = { order_id: 'swiggy-123', items: [] };

        mockAdapter.verifyWebhookSignature.mockReturnValue(true);
        mockAdapter.normalizeOrder.mockReturnValue({
          ...mockCanonicalOrder,
          rawPayload: payloadWithoutRestaurant,
        });
        mockIdempotency.claim.mockResolvedValue(true);

        const result = await service.handleWebhook(
          'swiggy',
          payloadWithoutRestaurant,
          { 'x-swiggy-signature': 'valid-sig' },
        );

        expect(result.status).toBe('unmapped_restaurant');
      });
    });
  });
});
