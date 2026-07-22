import { Test, TestingModule } from '@nestjs/testing';
import { OrderNormalizationService } from './order-normalization.service';
import { PrismaService } from '../../../../prisma/prisma.service';
import { QueueService } from '../../../../common/queue/queue.service';
import { EventBusService } from '../../../../common/event-bus/event-bus.service';
import { IdempotencyService } from './idempotency.service';
import { StatusMappingService } from './status-mapping.service';
import { DeadLetterService } from '../../monitoring/dead-letter.service';
import { CanonicalOrderInput } from '../types/canonical-order.type';

describe('OrderNormalizationService', () => {
  let service: OrderNormalizationService;
  let prisma: jest.Mocked<PrismaService>;
  let queueService: jest.Mocked<QueueService>;
  let eventBus: jest.Mocked<EventBusService>;
  let idempotency: jest.Mocked<IdempotencyService>;
  let statusMapping: jest.Mocked<StatusMappingService>;
  let deadLetter: jest.Mocked<DeadLetterService>;

  const mockMapping = {
    id: 'map-1',
    internalBranchId: 'branch-1',
    channel: 'SWIGGY',
    externalRestaurantId: 'swiggy-rest-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrder = {
    id: 'order-1',
    branchId: 'branch-1',
    tenantId: 'tenant-1',
    orderNumber: 1001,
    type: 'DELIVERY',
    status: 'PENDING',
    channel: 'SWIGGY',
    channelOrderId: 'swiggy-123',
    idempotencyKey: 'swiggy:swiggy-123',
    customerName: 'Test Customer',
    customerPhone: '+919999999999',
    subtotal: 500,
    taxAmount: 50,
    discountAmount: 0,
    totalAmount: 550,
    needsManualReview: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    channelData: {},
    channelRawPayloadRef: null,
    channelStatus: null,
    items: [{
      id: 'oi-1',
      orderId: 'order-1',
      menuItemId: 'item-1',
      name: 'Butter Chicken',
      quantity: 2,
      unitPrice: 250,
      totalPrice: 500,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      addOns: [{ id: 'ao-1', orderItemId: 'oi-1', name: 'Extra Cream', price: 30 }],
    }],
    statusHistory: [{
      id: 'sh-1',
      orderId: 'order-1',
      status: 'PENDING',
      notes: 'Order received via swiggy (external ID: swiggy-123)',
      createdBy: null,
      createdAt: new Date(),
    }],
  };

  const mockCanonicalInput: CanonicalOrderInput = {
    idempotencyKey: 'swiggy:swiggy-123',
    channel: 'swiggy',
    channelOrderId: 'swiggy-123',
    tenantId: 'tenant-1',
    branchId: 'branch-1',
    orderType: 'delivery',
    customer: {
      name: 'Test Customer',
      phone: '+919999999999',
    },
    items: [{
      menuItemId: 'item-1',
      name: 'Butter Chicken',
      quantity: 2,
      unitPrice: 250,
    }],
    pricing: {
      subtotal: 500,
      taxAmount: 50,
      grandTotal: 550,
    },
    payment: {
      status: 'paid',
      method: 'prepaid',
    },
    rawPayload: { order_id: 'swiggy-123', restaurant_id: 'swiggy-rest-1' },
  };

  const mockPrisma = {
    channelRestaurantMapping: {
      findFirst: jest.fn(),
    },
    channelItemMapping: {
      findFirst: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    customer: {
      upsert: jest.fn(),
    },
  };

  const mockQueueService = {
    enqueueOrderIngest: jest.fn(),
  };

  const mockEventBus = {
    orderCreated: jest.fn(),
  };

  const mockIdempotency = {
    check: jest.fn(),
    claim: jest.fn(),
    markConsumed: jest.fn(),
    release: jest.fn(),
  };

  const mockStatusMapping = {};
  const mockDeadLetter = { sendToDeadLetter: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderNormalizationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueueService },
        { provide: EventBusService, useValue: mockEventBus },
        { provide: IdempotencyService, useValue: mockIdempotency },
        { provide: StatusMappingService, useValue: mockStatusMapping },
        { provide: DeadLetterService, useValue: mockDeadLetter },
      ],
    }).compile();

    service = module.get<OrderNormalizationService>(OrderNormalizationService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    queueService = module.get(QueueService) as jest.Mocked<QueueService>;
    eventBus = module.get(EventBusService) as jest.Mocked<EventBusService>;
    idempotency = module.get(IdempotencyService) as jest.Mocked<IdempotencyService>;
    statusMapping = module.get(StatusMappingService) as jest.Mocked<StatusMappingService>;
    deadLetter = module.get(DeadLetterService) as jest.Mocked<DeadLetterService>;
  });

  // ── ACKNOWLEDGE ──

  describe('acknowledge', () => {
    it('should return already_processed when idempotency check passes and order exists', async () => {
      mockIdempotency.check.mockResolvedValue(true);
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'order-1', orderNumber: 1001 });

      const result = await service.acknowledge(mockCanonicalInput);

      expect(result.status).toBe('already_processed');
      expect(result.orderId).toBe('order-1');
      expect(result.orderNumber).toBe(1001);
      expect(mockIdempotency.check).toHaveBeenCalledWith('swiggy:swiggy-123');
    });

    it('should enqueue to BullMQ and return accepted when new order', async () => {
      mockIdempotency.check.mockResolvedValue(false);
      mockIdempotency.claim.mockResolvedValue(true);
      mockQueueService.enqueueOrderIngest.mockResolvedValue({ id: 'job-1' } as any);

      const result = await service.acknowledge(mockCanonicalInput);

      expect(result.status).toBe('accepted');
      expect(mockIdempotency.claim).toHaveBeenCalledWith('swiggy:swiggy-123');
      expect(mockQueueService.enqueueOrderIngest).toHaveBeenCalledWith({
        idempotencyKey: 'swiggy:swiggy-123',
        channel: 'swiggy',
        channelOrderId: 'swiggy-123',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        canonicalOrderJson: expect.any(Object),
      });
    });

    it('should return processing when another request holds the lock', async () => {
      mockIdempotency.check.mockResolvedValue(false);
      mockIdempotency.claim.mockResolvedValue(false);

      const result = await service.acknowledge(mockCanonicalInput);

      expect(result.status).toBe('processing');
      expect(mockQueueService.enqueueOrderIngest).not.toHaveBeenCalled();
    });

    it('should fall back to sync ingest when queue is unavailable', async () => {
      mockIdempotency.check.mockResolvedValue(false);
      mockIdempotency.claim.mockResolvedValue(true);
      mockQueueService.enqueueOrderIngest.mockResolvedValue(null);
      mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
      mockPrisma.channelItemMapping.findFirst.mockResolvedValue({ id: 'sku-1' });
      mockPrisma.order.findFirst.mockResolvedValue(null);
      mockPrisma.order.create.mockResolvedValue(mockOrder as any);

      const result = await service.acknowledge(mockCanonicalInput);

      expect(result.status).toBe('ok');
      expect(result.orderId).toBe('order-1');
      expect(mockPrisma.order.create).toHaveBeenCalled();
      expect(mockEventBus.orderCreated).toHaveBeenCalled();
    });

    it('should release idempotency lock and fall back to sync ingest on queue error', async () => {
      mockIdempotency.check.mockResolvedValue(false);
      mockIdempotency.claim.mockResolvedValue(true);
      mockQueueService.enqueueOrderIngest.mockRejectedValue(new Error('Queue full'));
      mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
      mockPrisma.channelItemMapping.findFirst.mockResolvedValue({ id: 'sku-1' });
      mockPrisma.order.findFirst.mockResolvedValue(null);
      mockPrisma.order.create.mockResolvedValue(mockOrder as any);

      const result = await service.acknowledge(mockCanonicalInput);

      expect(result.status).toBe('ok');
      expect(mockIdempotency.release).toHaveBeenCalledWith('swiggy:swiggy-123');
      expect(mockDeadLetter.sendToDeadLetter).toHaveBeenCalled();
      expect(mockPrisma.order.create).toHaveBeenCalled();
    });
  });

  // ── INGEST ──

  describe('ingest', () => {
    it('should throw error when no restaurant mapping exists', async () => {
      mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(null);

      await expect(service.ingest(mockCanonicalInput)).rejects.toThrow(
        'No active channel mapping for branch branch-1 on channel swiggy',
      );
    });

    it('should create order with correct fields when mapping exists', async () => {
      mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
      mockPrisma.channelItemMapping.findFirst.mockResolvedValue({ id: 'sku-1', syncStatus: 'SYNCED' });
      mockPrisma.order.findFirst.mockResolvedValue(null); // No previous orders
      mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust-1' });
      mockPrisma.order.create.mockResolvedValue(mockOrder as any);

      const result = await service.ingest(mockCanonicalInput);

      expect(result).toBeDefined();
      expect(result.id).toBe('order-1');
      expect(result.orderNumber).toBe(1001);
      expect(result.status).toBe('received');
      expect(result.channel).toBe('swiggy');
      expect(result.channelOrderId).toBe('swiggy-123');

      // Verify customer upsert was called
      expect(mockPrisma.customer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId_phone: { tenantId: 'tenant-1', phone: '+919999999999' } },
        }),
      );

      // Verify order create was called
      expect(mockPrisma.order.create).toHaveBeenCalled();
      expect(mockEventBus.orderCreated).toHaveBeenCalled();
      expect(mockIdempotency.markConsumed).toHaveBeenCalledWith('swiggy:swiggy-123', 'order-1');
    });

    it('should flag order as needsManualReview when items are unmapped', async () => {
      mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
      mockPrisma.channelItemMapping.findFirst
        .mockResolvedValueOnce(null) // First item unmapped
        .mockResolvedValueOnce({ id: 'sku-2' }); // Second item mapped

      const inputWithUnmappedItem: CanonicalOrderInput = {
        ...mockCanonicalInput,
        items: [
          { menuItemId: 'item-unknown', name: 'Unknown Dish', quantity: 1, unitPrice: 100 },
          { menuItemId: 'item-2', name: 'Naan', quantity: 3, unitPrice: 40 },
        ],
      };

      mockPrisma.order.findFirst.mockResolvedValue(null);
      mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust-1' });

      const mockOrderWithReview = {
        ...mockOrder,
        needsManualReview: true,
        items: [
          { id: 'oi-1', name: 'Unknown Dish', addOns: [] },
          { id: 'oi-2', name: 'Naan', addOns: [] },
        ],
      };
      mockPrisma.order.create.mockResolvedValue(mockOrderWithReview as any);

      const result = await service.ingest(inputWithUnmappedItem);

      expect(result).toBeDefined();
      expect(mockPrisma.channelItemMapping.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should handle order without customer phone gracefully', async () => {
      mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
      mockPrisma.channelItemMapping.findFirst.mockResolvedValue({ id: 'sku-1' });
      mockPrisma.order.findFirst.mockResolvedValue(null);
      mockPrisma.order.create.mockResolvedValue(mockOrder as any);

      const inputNoPhone: CanonicalOrderInput = {
        ...mockCanonicalInput,
        customer: { name: 'Walk-in Guest' },
      };

      const result = await service.ingest(inputNoPhone);

      expect(result).toBeDefined();
      expect(mockPrisma.customer.upsert).not.toHaveBeenCalled();
    });

    it('should generate incrementing order numbers', async () => {
      mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
      mockPrisma.channelItemMapping.findFirst.mockResolvedValue({ id: 'sku-1' });
      mockPrisma.order.findFirst.mockResolvedValue({ orderNumber: 1050 });
      mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust-1' });

      const createdOrder = { ...mockOrder, orderNumber: 1051 };
      mockPrisma.order.create.mockResolvedValue(createdOrder as any);

      const result = await service.ingest(mockCanonicalInput);

      expect(result.orderNumber).toBe(1051);
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ orderNumber: 1051 }),
        }),
      );
    });

    it('should handle modifiers/addons on items', async () => {
      mockPrisma.channelRestaurantMapping.findFirst.mockResolvedValue(mockMapping);
      mockPrisma.channelItemMapping.findFirst.mockResolvedValue({ id: 'sku-1' });
      mockPrisma.order.findFirst.mockResolvedValue(null);
      mockPrisma.customer.upsert.mockResolvedValue({ id: 'cust-1' });

      const inputWithModifiers: CanonicalOrderInput = {
        ...mockCanonicalInput,
        items: [{
          menuItemId: 'item-1',
          name: 'Burger',
          quantity: 1,
          unitPrice: 200,
          modifiers: [{ name: 'Extra Cheese', price: 30 }, { name: 'Bacon', price: 50 }],
        }],
      };

      mockPrisma.order.create.mockResolvedValue({
        ...mockOrder,
        items: [{ id: 'oi-1', name: 'Burger', addOns: [{ name: 'Extra Cheese', price: 30 }, { name: 'Bacon', price: 50 }] }],
      } as any);

      const result = await service.ingest(inputWithModifiers);

      expect(result).toBeDefined();
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  addOns: expect.objectContaining({
                    create: expect.arrayContaining([
                      expect.objectContaining({ name: 'Extra Cheese', price: 30 }),
                    ]),
                  }),
                }),
              ]),
            }),
          }),
        }),
      );
    });
  });
});
