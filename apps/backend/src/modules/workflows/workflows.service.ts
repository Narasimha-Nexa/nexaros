import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EventBusService } from '../../common/event-bus/event-bus.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import {
  CreateWorkflowTemplateDto,
  CreateWorkflowRequestDto,
} from './dto';

export interface WorkflowStep {
  name: string;
  approverRole: string;
  action?: 'none' | 'notify' | 'webhook' | 'status_change';
  actionConfig?: Record<string, any>;
}

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
    private notifications: NotificationsService,
  ) {}

  async createTemplate(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      entityType: string;
      triggerEvent: string;
      steps: WorkflowStep[];
      isActive?: boolean;
    },
  ) {
    if (!data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
      throw new BadRequestException('Steps must be a non-empty array');
    }
    return this.prisma.workflowTemplate.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        entityType: data.entityType,
        triggerEvent: data.triggerEvent,
        steps: data.steps as unknown as Prisma.InputJsonValue,
        isActive: data.isActive ?? true,
      },
    });
  }

  async listTemplates(tenantId: string) {
    return this.prisma.workflowTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplate(tenantId: string, id: string) {
    const template = await this.prisma.workflowTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) throw new NotFoundException('Workflow template not found');
    return template;
  }

  async updateTemplate(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      entityType?: string;
      triggerEvent?: string;
      steps?: WorkflowStep[];
      isActive?: boolean;
    },
  ) {
    await this.getTemplate(tenantId, id);
    const updateData: Prisma.WorkflowTemplateUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.entityType !== undefined) updateData.entityType = data.entityType;
    if (data.triggerEvent !== undefined) updateData.triggerEvent = data.triggerEvent;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.steps !== undefined) updateData.steps = data.steps as unknown as Prisma.InputJsonValue;
    return this.prisma.workflowTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTemplate(tenantId: string, id: string) {
    await this.getTemplate(tenantId, id);
    return this.prisma.workflowTemplate.delete({
      where: { id },
    });
  }

  async createRequest(
    tenantId: string,
    data: CreateWorkflowRequestDto & { requestedBy: string },
  ) {
    const template = await this.getTemplate(tenantId, data.templateId);
    if (!template.isActive) {
      throw new BadRequestException('Workflow template is inactive');
    }
    const request = await this.prisma.workflowRequest.create({
      data: {
        tenantId,
        templateId: data.templateId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        requestData: data.requestData ?? {},
        requestedBy: data.requestedBy,
        currentStep: 0,
        status: 'PENDING',
      },
      include: { template: true },
    });

    // Notify the current-step approver.
    await this.notifyCurrentApprovers(request, 'A new approval request is awaiting your action.');

    this.eventBus.emitToTenant(tenantId, 'workflow:created', {
      requestId: request.id,
      templateId: template.id,
      templateName: template.name,
      entityType: request.entityType,
      entityId: request.entityId,
    });

    return request;
  }

  async listRequests(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    return this.prisma.workflowRequest.findMany({
      where,
      include: { template: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequest(tenantId: string, id: string) {
    const request = await this.prisma.workflowRequest.findFirst({
      where: { id, tenantId },
      include: { template: true },
    });
    if (!request) throw new NotFoundException('Workflow request not found');
    return request;
  }

  async approveRequest(
    tenantId: string,
    requestId: string,
    userId: string,
    notes?: string,
    actorRole?: string,
  ) {
    const request = await this.getRequest(tenantId, requestId);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not in PENDING status');
    }

    const template = request.template;
    const steps = template.steps as unknown as WorkflowStep[];
    const currentStepIndex = request.currentStep;

    if (currentStepIndex >= steps.length) {
      throw new BadRequestException('All steps have already been completed');
    }

    const currentStepDef = steps[currentStepIndex];

    const isPrivileged = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN' || actorRole === 'OWNER';

    const staff = isPrivileged
      ? null
      : await this.prisma.staff.findFirst({
          where: { userId },
          include: { role: true },
        });

    if (!staff && !isPrivileged) {
      throw new ForbiddenException('User does not have a staff record');
    }

    const userRole = staff?.role?.name?.toUpperCase();
    const requiredRole = currentStepDef.approverRole?.toUpperCase();

    if (!isPrivileged && requiredRole && requiredRole !== 'ANY' && userRole !== requiredRole) {
      const userUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (userUser?.role !== 'OWNER') {
        throw new ForbiddenException(
          `User role '${userRole}' does not match required approver role '${requiredRole}' for step ${currentStepIndex + 1}`,
        );
      }
    }

    const nextStep = currentStepIndex + 1;
    const allStepsDone = nextStep >= steps.length;

    // Execute this step's action if defined and it's the terminal step or per-step.
    const executionLog: any[] = (request.executionLog as any[]) || [];
    if (currentStepDef.action && currentStepDef.action !== 'none') {
      try {
        const result = await this.executeAction(tenantId, currentStepDef, request);
        executionLog.push({ step: currentStepIndex + 1, action: currentStepDef.action, status: 'executed', result, at: new Date().toISOString() });
      } catch (err: any) {
        executionLog.push({ step: currentStepIndex + 1, action: currentStepDef.action, status: 'failed', error: err.message, at: new Date().toISOString() });
        this.logger.warn(`Workflow action failed for request ${requestId}: ${err.message}`);
      }
    }

    const updated = await this.prisma.workflowRequest.update({
      where: { id: requestId },
      data: {
        currentStep: nextStep,
        status: allStepsDone ? 'APPROVED' : 'PENDING',
        decision: allStepsDone ? 'APPROVED' : undefined,
        decidedBy: allStepsDone ? userId : undefined,
        decidedAt: allStepsDone ? new Date() : undefined,
        notes: notes || request.notes,
        executionLog: executionLog as any,
      },
      include: { template: true },
    });

    if (allStepsDone) {
      // Final approval: execute terminal template-level actions and notify requester.
      await this.notifyRequester(updated, `Your ${template.name} request was approved.`);
      this.eventBus.emitToTenant(tenantId, 'workflow:approved', {
        requestId,
        templateName: template.name,
        entityType: request.entityType,
        entityId: request.entityId,
      });
    } else {
      await this.notifyCurrentApprovers(updated, `Step ${nextStep + 1} of "${template.name}" is awaiting your approval.`);
      this.eventBus.emitToTenant(tenantId, 'workflow:advanced', {
        requestId,
        templateName: template.name,
        currentStep: nextStep,
      });
    }

    return updated;
  }

  async rejectRequest(
    tenantId: string,
    requestId: string,
    userId: string,
    notes?: string,
    actorRole?: string,
  ) {
    const request = await this.getRequest(tenantId, requestId);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not in PENDING status');
    }

    const template = request.template;
    const steps = template.steps as unknown as WorkflowStep[];
    const currentStepIndex = request.currentStep;

    if (currentStepIndex >= steps.length) {
      throw new BadRequestException('No active step to reject');
    }

    const currentStepDef = steps[currentStepIndex];

    const isPrivileged = actorRole === 'SUPER_ADMIN' || actorRole === 'ADMIN' || actorRole === 'OWNER';

    const staff = isPrivileged
      ? null
      : await this.prisma.staff.findFirst({
          where: { userId },
          include: { role: true },
        });

    if (!staff && !isPrivileged) {
      throw new ForbiddenException('User does not have a staff record');
    }

    const userRole = staff?.role?.name?.toUpperCase();
    const requiredRole = currentStepDef.approverRole?.toUpperCase();

    if (!isPrivileged && requiredRole && requiredRole !== 'ANY' && userRole !== requiredRole) {
      const userUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (userUser?.role !== 'OWNER') {
        throw new ForbiddenException(
          `User role '${userRole}' does not match required approver role '${requiredRole}' for step ${currentStepIndex + 1}`,
        );
      }
    }

    const updated = await this.prisma.workflowRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        decision: 'REJECTED',
        decidedBy: userId,
        decidedAt: new Date(),
        notes: notes || request.notes,
      },
      include: { template: true },
    });

    await this.notifyRequester(updated, `Your ${template.name} request was rejected.${notes ? ` Reason: ${notes}` : ''}`);
    this.eventBus.emitToTenant(tenantId, 'workflow:rejected', {
      requestId,
      templateName: template.name,
      entityType: request.entityType,
      entityId: request.entityId,
    });

    return updated;
  }

  async cancelRequest(
    tenantId: string,
    requestId: string,
    userId: string,
  ) {
    const request = await this.getRequest(tenantId, requestId);
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING requests can be cancelled');
    }
    if (request.requestedBy !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== 'OWNER') {
        throw new ForbiddenException('You can only cancel your own requests');
      }
    }

    const updated = await this.prisma.workflowRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        decision: 'CANCELLED',
        decidedBy: userId,
        decidedAt: new Date(),
      },
    });

    this.eventBus.emitToTenant(tenantId, 'workflow:cancelled', { requestId });
    return updated;
  }

  /**
   * Execute a workflow step action. Supports: notify (in-app/email), webhook (HTTP POST),
   * and status_change (placeholder for entity mutation). Returns a result descriptor.
   */
  private async executeAction(tenantId: string, step: WorkflowStep, request: any): Promise<Record<string, any>> {
    const cfg = step.actionConfig || {};
    switch (step.action) {
      case 'notify': {
        await this.notifications.send(tenantId, {
          title: cfg.title || `Workflow: ${request.action}`,
          message: cfg.message || `Approval action for ${request.entityType} ${request.entityId}`,
          channel: cfg.channel || 'IN_APP',
          entityType: request.entityType,
          entityId: request.entityId,
          recipientEmail: cfg.recipientEmail,
          recipientPhone: cfg.recipientPhone,
        });
        return { notified: true, channel: cfg.channel || 'IN_APP' };
      }
      case 'webhook': {
        if (!cfg.url) return { skipped: 'no url' };
        try {
          const res = await fetch(cfg.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(cfg.headers || {}) },
            body: JSON.stringify({ event: 'workflow:action', step: step.name, request }),
          });
          return { status: res.status, ok: res.ok };
        } catch (err: any) {
          return { error: err.message };
        }
      }
      case 'status_change': {
        // Placeholder for entity mutation based on cfg. Extend per entityType as needed.
        this.logger.log(`[workflow] status_change requested for ${request.entityType}:${request.entityId} -> ${cfg.status || 'N/A'}`);
        return { statusChange: cfg.status || null, entityType: request.entityType };
      }
      default:
        return { skipped: true };
    }
  }

  /** Notify users whose role matches the current pending step's approverRole. */
  private async notifyCurrentApprovers(request: any, message: string): Promise<void> {
    const steps = request.template?.steps as unknown as WorkflowStep[];
    if (!steps?.length) return;
    const step = steps[request.currentStep];
    if (!step) return;
    const role = step.approverRole?.toUpperCase();
    const recipients = await this.prisma.staff.findMany({
      where: {
        tenantId: request.tenantId,
        isActive: true,
        ...(role && role !== 'ANY' ? { role: { name: { equals: role, mode: 'insensitive' } } } : {}),
      },
      select: { userId: true },
    });
    const title = `Approval needed: ${request.template?.name || request.entityType}`;
    for (const r of recipients) {
      await this.notifications.send(request.tenantId, {
        title,
        message,
        channel: 'IN_APP',
        entityType: 'workflow_request',
        entityId: request.id,
        recipientId: r.userId ?? undefined,
      });
    }
  }

  private async notifyRequester(request: any, message: string): Promise<void> {
    await this.notifications.send(request.tenantId, {
      title: `Workflow ${request.status.toLowerCase()}: ${request.template?.name || ''}`.trim(),
      message,
      channel: 'IN_APP',
      entityType: 'workflow_request',
      entityId: request.id,
      recipientId: request.requestedBy,
    });
  }

  async getStats(tenantId: string) {
    const [pending, approved, rejected, total] = await Promise.all([
      this.prisma.workflowRequest.count({ where: { tenantId, status: 'PENDING' } }),
      this.prisma.workflowRequest.count({ where: { tenantId, status: 'APPROVED' } }),
      this.prisma.workflowRequest.count({ where: { tenantId, status: 'REJECTED' } }),
      this.prisma.workflowRequest.count({ where: { tenantId } }),
    ]);

    return { pending, approved, rejected, total };
  }

  /**
   * Auto-trigger workflows whose triggerEvent matches a domain event.
   * Called by the EventBus integration layer when domain events fire.
   */
  async handleDomainEvent(tenantId: string, event: string, payload: Record<string, any>) {
    const templates = await this.prisma.workflowTemplate.findMany({
      where: { tenantId, isActive: true, triggerEvent: event },
    });
    for (const tpl of templates) {
      try {
        await this.createRequest(tenantId, {
          templateId: tpl.id,
          entityType: tpl.entityType,
          entityId: payload.entityId || payload.id || 'unknown',
          action: event,
          requestData: payload,
          requestedBy: payload.requestedBy || 'system',
        });
      } catch (err: any) {
        this.logger.warn(`Auto-trigger workflow ${tpl.id} failed: ${err.message}`);
      }
    }
  }
}
