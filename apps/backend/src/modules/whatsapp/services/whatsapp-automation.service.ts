import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WhatsAppCloudApiService } from './whatsapp-cloud-api.service';
import { EventBusService } from '../../../common/event-bus/event-bus.service';
import { WhatsAppAutomation, WhatsAppAccount } from '@prisma/client';

/**
 * WhatsApp Automation Rules Service
 *
 * Manages trigger-based auto-responses and workflows:
 * - New session greetings
 * - Menu requests
 * - Order confirmations
 * - Payment notifications
 * - Custom keyword triggers
 * - Inactivity timeouts
 */
@Injectable()
export class WhatsAppAutomationService {
  private readonly logger = new Logger(WhatsAppAutomationService.name);

  constructor(
    private prisma: PrismaService,
    private cloudApiService: WhatsAppCloudApiService,
    private eventBus: EventBusService,
  ) {}

  /**
   * Create a new automation rule
   */
  async createAutomation(
    accountId: string,
    data: CreateAutomationDto,
  ): Promise<WhatsAppAutomation> {
    const account = await this.cloudApiService.getAccount(accountId);
    if (!account) {
      throw new NotFoundException('WhatsApp account not found');
    }

    return this.prisma.whatsAppAutomation.create({
      data: {
        accountId,
        tenantId: account.tenantId,
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        triggerConditions: data.triggerConditions,
        action: data.action,
        actionConfig: data.actionConfig,
        templateId: data.templateId,
        priority: data.priority || 0,
        maxExecutions: data.maxExecutions,
        cooldownSeconds: data.cooldownSeconds || 0,
      },
    });
  }

  /**
   * Get all automations for an account
   */
  async getAutomations(
    accountId: string,
    filters?: {
      trigger?: string;
      isActive?: boolean;
    },
  ): Promise<WhatsAppAutomation[]> {
    const where: any = {
      accountId,
      deletedAt: null,
    };

    if (filters?.trigger) {
      where.trigger = filters.trigger;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return this.prisma.whatsAppAutomation.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get a single automation by ID
   */
  async getAutomation(automationId: string): Promise<WhatsAppAutomation> {
    const automation = await this.prisma.whatsAppAutomation.findUnique({
      where: { id: automationId },
    });

    if (!automation || automation.deletedAt) {
      throw new NotFoundException('Automation not found');
    }

    return automation;
  }

  /**
   * Update an automation
   */
  async updateAutomation(
    automationId: string,
    data: Partial<CreateAutomationDto>,
  ): Promise<WhatsAppAutomation> {
    await this.getAutomation(automationId);

    return this.prisma.whatsAppAutomation.update({
      where: { id: automationId },
      data,
    });
  }

  /**
   * Toggle automation active status
   */
  async toggleAutomation(automationId: string): Promise<WhatsAppAutomation> {
    const automation = await this.getAutomation(automationId);

    return this.prisma.whatsAppAutomation.update({
      where: { id: automationId },
      data: { isActive: !automation.isActive },
    });
  }

  /**
   * Delete an automation (soft delete)
   */
  async deleteAutomation(automationId: string): Promise<void> {
    await this.getAutomation(automationId);

    await this.prisma.whatsAppAutomation.update({
      where: { id: automationId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Process incoming message and trigger matching automations
   */
  async processMessage(
    accountId: string,
    from: string,
    textContent: string,
    metadata?: Record<string, any>,
  ): Promise<boolean> {
    const account = await this.cloudApiService.getAccount(accountId);
    if (!account) return false;

    // Get active automations sorted by priority
    const automations = await this.prisma.whatsAppAutomation.findMany({
      where: {
        accountId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: { priority: 'desc' },
    });

    for (const automation of automations) {
      // Check if trigger matches
      if (this.matchesTrigger(automation, textContent, metadata)) {
        // Check cooldown
        if (await this.isInCooldown(automation)) {
          continue;
        }

        // Check execution limit
        if (await this.hasReachedLimit(automation)) {
          continue;
        }

        // Execute automation
        await this.executeAutomation(automation, from, textContent, metadata);

        // Update execution count
        await this.prisma.whatsAppAutomation.update({
          where: { id: automation.id },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date(),
          },
        });

        this.logger.log(`Automation ${automation.name} triggered for ${from}`);
        return true; // Only execute first matching automation
      }
    }

    return false;
  }

  /**
   * Check if an automation's trigger matches the message
   */
  private matchesTrigger(
    automation: WhatsAppAutomation,
    textContent: string,
    metadata?: Record<string, any>,
  ): boolean {
    const lowerText = textContent.toLowerCase();
    const conditions = automation.triggerConditions as any;

    switch (automation.trigger) {
      case 'NEW_SESSION':
        return metadata?.isNewSession === true;

      case 'GREETING':
        return ['hi', 'hello', 'hey', 'good morning', 'good evening'].some((g) =>
          lowerText.includes(g),
        );

      case 'MENU_REQUEST':
        return ['menu', 'food', 'order', 'what do you have'].some((w) =>
          lowerText.includes(w),
        );

      case 'ORDER_PLACED':
        return metadata?.event === 'order.placed';

      case 'PAYMENT_RECEIVED':
        return metadata?.event === 'payment.completed';

      case 'ORDER_READY':
        return metadata?.event === 'order.ready';

      case 'DELIVERY_UPDATE':
        return metadata?.event === 'delivery.update';

      case 'CUSTOM_KEYWORD':
        return conditions?.keywords?.some((kw: string) =>
          lowerText.includes(kw.toLowerCase()),
        );

      case 'INACTIVITY_TIMEOUT':
        return metadata?.inactiveMinutes >= (conditions?.timeoutMinutes || 30);

      case 'FIRST_ORDER':
        return metadata?.orderCount === 1;

      default:
        return false;
    }
  }

  /**
   * Check if automation is in cooldown period
   */
  private async isInCooldown(automation: WhatsAppAutomation): Promise<boolean> {
    if (!automation.cooldownSeconds || !automation.lastExecutedAt) {
      return false;
    }

    const cooldownEnd = new Date(
      automation.lastExecutedAt.getTime() + automation.cooldownSeconds * 1000,
    );

    return new Date() < cooldownEnd;
  }

  /**
   * Check if automation has reached execution limit
   */
  private async hasReachedLimit(automation: WhatsAppAutomation): Promise<boolean> {
    if (!automation.maxExecutions) {
      return false;
    }

    return automation.executionCount >= automation.maxExecutions;
  }

  /**
   * Execute an automation action
   */
  private async executeAutomation(
    automation: WhatsAppAutomation,
    to: string,
    textContent: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const config = automation.actionConfig as any;

    switch (automation.action) {
      case 'SEND_TEMPLATE':
        if (automation.templateId) {
          const template = await this.prisma.whatsAppTemplate.findUnique({
            where: { id: automation.templateId },
          });

          if (template) {
            await this.cloudApiService.sendTemplateMessage(
              automation.accountId,
              to,
              template.name,
              template.language,
              config?.parameters,
            );
          }
        }
        break;

      case 'SEND_TEXT':
        if (config?.text) {
          await this.cloudApiService.sendTextMessage(
            automation.accountId,
            to,
            config.text,
          );
        }
        break;

      case 'SEND_CATALOG':
        if (config?.catalogItems) {
          // TODO: Implement catalog message
          this.logger.log(`Catalog message to ${to}`);
        }
        break;

      case 'REQUEST_LOCATION':
        await this.cloudApiService.sendTextMessage(
          automation.accountId,
          to,
          'Please share your delivery location 📍',
        );
        break;

      case 'REQUEST_CONTACT':
        await this.cloudApiService.sendTextMessage(
          automation.accountId,
          to,
          'Please share your contact details 📱',
        );
        break;

      case 'TRANSFER_TO_AGENT':
        // Emit event for human agent pickup
        await this.eventBus.emitToTenant(automation.tenantId, 'whatsapp:transfer:agent', {
          accountId: automation.accountId,
          customerPhone: to,
          reason: config?.reason,
        });
        break;

      case 'CREATE_ORDER':
        // Emit event for order creation
        await this.eventBus.emitToTenant(automation.tenantId, 'whatsapp:order:create', {
          accountId: automation.accountId,
          customerPhone: to,
          textContent,
        });
        break;

      case 'APPLY_DISCOUNT':
        if (config?.discountCode) {
          await this.cloudApiService.sendTextMessage(
            automation.accountId,
            to,
            `🎉 Use code ${config.discountCode} for ${config.discountPercent || 10}% off your next order!`,
          );
        }
        break;

      case 'SEND_MENU':
        // TODO: Implement menu message with items
        await this.cloudApiService.sendTextMessage(
          automation.accountId,
          to,
          '📋 Here\'s our menu! Reply with items you\'d like to order.',
        );
        break;
    }
  }
}

export interface CreateAutomationDto {
  name: string;
  description?: string;
  trigger: 'NEW_SESSION' | 'GREETING' | 'MENU_REQUEST' | 'ORDER_PLACED' | 'PAYMENT_RECEIVED' | 'ORDER_READY' | 'DELIVERY_UPDATE' | 'CUSTOM_KEYWORD' | 'INACTIVITY_TIMEOUT' | 'FIRST_ORDER';
  triggerConditions?: Record<string, any>;
  action: 'SEND_TEMPLATE' | 'SEND_TEXT' | 'SEND_CATALOG' | 'REQUEST_LOCATION' | 'REQUEST_CONTACT' | 'TRANSFER_TO_AGENT' | 'CREATE_ORDER' | 'APPLY_DISCOUNT' | 'SEND_MENU';
  actionConfig?: Record<string, any>;
  templateId?: string;
  priority?: number;
  maxExecutions?: number;
  cooldownSeconds?: number;
}
