import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AiCopilotController } from './ai-copilot.controller';
import { AiChatService } from './ai-chat.service';
import { AiReportService } from './ai-report.service';
import { LlmService } from './llm.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ToolExecutorService } from './tool-executor.service';
import { RagService } from './rag.service';
import { MemoryService } from './memory.service';
import { GuardrailsService } from './guardrails.service';
import { PermissionsService } from './permissions.service';
import { AuditService } from './audit.service';
import { ChartService } from './chart.service';
import { AiChatGateway } from './ai-chat.gateway';
import { BiModule } from '../bi/bi.module';
import { ForecastModule } from '../forecast/forecast.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    BiModule,
    ForecastModule,
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    ConfigModule,
  ],
  controllers: [AiCopilotController],
  providers: [
    AiChatService,
    AiReportService,
    LlmService,
    PromptBuilderService,
    ToolExecutorService,
    RagService,
    MemoryService,
    GuardrailsService,
    PermissionsService,
    AuditService,
    ChartService,
    AiChatGateway,
  ],
  exports: [AiChatService, AiReportService, LlmService],
})
export class AiChatModule {}
