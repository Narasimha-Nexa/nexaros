import { Module, OnModuleInit } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { AdminWorkflowsController } from './admin-workflows.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventBusService } from '../../common/event-bus/event-bus.service';

@Module({
  imports: [AuthModule, PrismaModule, NotificationsModule],
  controllers: [WorkflowsController, AdminWorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule implements OnModuleInit {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly eventBus: EventBusService,
  ) {}

  onModuleInit() {
    this.eventBus.registerDomainEventHandler((tenantId, event, payload) =>
      this.workflowsService.handleDomainEvent(tenantId, event, payload),
    );
  }
}
