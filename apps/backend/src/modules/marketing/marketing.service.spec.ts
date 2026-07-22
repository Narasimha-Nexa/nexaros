import { Test, TestingModule } from '@nestjs/testing';
import { MarketingService } from './marketing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MarketingService', () => {
  let service: MarketingService;
  let prisma: jest.Mocked<PrismaService>;
  let eventBus: jest.Mocked<EventBusService>;

  const tenantId = 'tenant-1';

  const mockCampaign = {
    id: 'camp-1',
    tenantId,
    branchId: null,
    name: 'Summer Sale',
    description: 'Big summer discounts',
    type: 'PROMOTIONAL',
    channel: 'EMAIL',
    status: 'DRAFT',
    audienceIds: null,
    audienceFilter: null,
    templateId: null,
    scheduleAt: null,
    sentAt: null,
    sentCount: 0,
    openCount: 0,
    clickCount: 0,
    conversionCount: 0,
    metadata: null,
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTemplate = {
    id: 'tmpl-1',
    tenantId,
    name: 'Welcome Email',
    subject: 'Welcome!',
    body: '<h1>Welcome</h1>',
    variables: null,
    category: 'marketing',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAudience = {
    id: 'aud-1',
    tenantId,
    name: 'VIP Customers',
    description: 'High spenders',
    criteria: { minOrders: 10 },
    customerCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    campaign: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emailTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    audienceSegment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockEventBus = {
    emitToTenant: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<MarketingService>(MarketingService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    eventBus = module.get(EventBusService) as jest.Mocked<EventBusService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── Campaigns ──

  describe('findAllCampaigns', () => {
    it('should return all campaigns for tenant', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([mockCampaign]);

      const result = await service.findAllCampaigns(tenantId);

      expect(result).toHaveLength(1);
      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId } }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([mockCampaign]);

      await service.findAllCampaigns(tenantId, { status: 'DRAFT' });

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId, status: 'DRAFT' } }),
      );
    });
  });

  describe('findCampaign', () => {
    it('should return a campaign by id', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);

      const result = await service.findCampaign('camp-1');

      expect(result).toMatchObject({ id: 'camp-1', name: 'Summer Sale' });
    });

    it('should throw NotFoundException when campaign not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.findCampaign('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCampaign', () => {
    it('should create a campaign', async () => {
      mockPrisma.campaign.create.mockResolvedValue(mockCampaign);

      const result = await service.createCampaign(tenantId, {
        name: 'Summer Sale',
        type: 'PROMOTIONAL',
        channel: 'EMAIL',
      } as any);

      expect(result).toMatchObject({ id: 'camp-1' });
      expect(mockPrisma.campaign.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId, name: 'Summer Sale' }),
        }),
      );
    });
  });

  describe('updateCampaign', () => {
    it('should update a campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaign.update.mockResolvedValue({ ...mockCampaign, name: 'Updated' });

      const result = await service.updateCampaign('camp-1', { name: 'Updated' } as any);

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when campaign not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.updateCampaign('missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('launchCampaign', () => {
    it('should launch a draft campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaign.update.mockResolvedValue({ ...mockCampaign, status: 'SENDING', sentAt: new Date() });

      const result = await service.launchCampaign('camp-1');

      expect(result.status).toBe('SENDING');
      expect(mockEventBus.emitToTenant).toHaveBeenCalledWith(tenantId, 'campaign:launched', { campaignId: 'camp-1' });
    });

    it('should throw BadRequestException when campaign is already sent', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'SENT' });

      await expect(service.launchCampaign('camp-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelCampaign', () => {
    it('should cancel a draft campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaign.update.mockResolvedValue({ ...mockCampaign, status: 'CANCELLED' });

      const result = await service.cancelCampaign('camp-1');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException when campaign is already sent', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({ ...mockCampaign, status: 'SENT' });

      await expect(service.cancelCampaign('camp-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteCampaign', () => {
    it('should delete a campaign', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaign.delete.mockResolvedValue(mockCampaign);

      await service.deleteCampaign('camp-1');

      expect(mockPrisma.campaign.delete).toHaveBeenCalledWith({ where: { id: 'camp-1' } });
    });

    it('should throw NotFoundException when campaign not found', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue(null);

      await expect(service.deleteCampaign('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([
        { ...mockCampaign, status: 'SENT', sentCount: 100, openCount: 50, clickCount: 25 },
        { ...mockCampaign, id: 'camp-2', status: 'DRAFT' },
      ]);

      const result = await service.getCampaignStats(tenantId);

      expect(result.total).toBe(2);
      expect(result.sent).toBe(1);
      expect(result.draft).toBe(1);
      expect(result.totalSent).toBe(100);
      expect(result.totalOpens).toBe(50);
      expect(result.totalClicks).toBe(25);
    });
  });

  // ── Templates ──

  describe('findAllTemplates', () => {
    it('should return all templates for tenant', async () => {
      mockPrisma.emailTemplate.findMany.mockResolvedValue([mockTemplate]);

      const result = await service.findAllTemplates(tenantId);

      expect(result).toHaveLength(1);
    });

    it('should filter by category', async () => {
      mockPrisma.emailTemplate.findMany.mockResolvedValue([mockTemplate]);

      await service.findAllTemplates(tenantId, 'marketing');

      expect(mockPrisma.emailTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId, category: 'marketing' } }),
      );
    });
  });

  describe('findTemplate', () => {
    it('should return a template by id', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await service.findTemplate('tmpl-1');

      expect(result).toMatchObject({ id: 'tmpl-1' });
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findTemplate('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createTemplate', () => {
    it('should create a template', async () => {
      mockPrisma.emailTemplate.create.mockResolvedValue(mockTemplate);

      const result = await service.createTemplate(tenantId, {
        name: 'Welcome Email',
        subject: 'Welcome!',
        body: '<h1>Welcome</h1>',
      } as any);

      expect(result).toMatchObject({ id: 'tmpl-1' });
    });
  });

  describe('updateTemplate', () => {
    it('should update a template', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.emailTemplate.update.mockResolvedValue({ ...mockTemplate, name: 'Updated' });

      const result = await service.updateTemplate('tmpl-1', { name: 'Updated' } as any);

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(service.updateTemplate('missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTemplate', () => {
    it('should delete a template', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.emailTemplate.delete.mockResolvedValue(mockTemplate);

      await service.deleteTemplate('tmpl-1');

      expect(mockPrisma.emailTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tmpl-1' } });
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrisma.emailTemplate.findUnique.mockResolvedValue(null);

      await expect(service.deleteTemplate('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── Audience Segments ──

  describe('findAllAudiences', () => {
    it('should return all audience segments for tenant', async () => {
      mockPrisma.audienceSegment.findMany.mockResolvedValue([mockAudience]);

      const result = await service.findAllAudiences(tenantId);

      expect(result).toHaveLength(1);
    });
  });

  describe('findAudience', () => {
    it('should return an audience by id', async () => {
      mockPrisma.audienceSegment.findUnique.mockResolvedValue(mockAudience);

      const result = await service.findAudience('aud-1');

      expect(result).toMatchObject({ id: 'aud-1' });
    });

    it('should throw NotFoundException when audience not found', async () => {
      mockPrisma.audienceSegment.findUnique.mockResolvedValue(null);

      await expect(service.findAudience('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAudience', () => {
    it('should create an audience segment', async () => {
      mockPrisma.audienceSegment.create.mockResolvedValue(mockAudience);

      const result = await service.createAudience(tenantId, {
        name: 'VIP Customers',
        criteria: { minOrders: 10 },
      } as any);

      expect(result).toMatchObject({ id: 'aud-1' });
    });
  });

  describe('updateAudience', () => {
    it('should update an audience segment', async () => {
      mockPrisma.audienceSegment.findUnique.mockResolvedValue(mockAudience);
      mockPrisma.audienceSegment.update.mockResolvedValue({ ...mockAudience, name: 'Updated' });

      const result = await service.updateAudience('aud-1', { name: 'Updated' } as any);

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when audience not found', async () => {
      mockPrisma.audienceSegment.findUnique.mockResolvedValue(null);

      await expect(service.updateAudience('missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAudience', () => {
    it('should delete an audience segment', async () => {
      mockPrisma.audienceSegment.findUnique.mockResolvedValue(mockAudience);
      mockPrisma.audienceSegment.delete.mockResolvedValue(mockAudience);

      await service.deleteAudience('aud-1');

      expect(mockPrisma.audienceSegment.delete).toHaveBeenCalledWith({ where: { id: 'aud-1' } });
    });

    it('should throw NotFoundException when audience not found', async () => {
      mockPrisma.audienceSegment.findUnique.mockResolvedValue(null);

      await expect(service.deleteAudience('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
