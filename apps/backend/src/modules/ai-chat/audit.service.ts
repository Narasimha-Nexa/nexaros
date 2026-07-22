import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditEntry {
  tenantId: string;
  userId: string;
  action: string;
  message: string;
  conversationId?: string;
  provider?: string;
  model?: string;
  tokensUsed: number;
  durationMs: number;
  toolsCalled: string[];
  success: boolean;
  error?: string;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.aIUsage.create({
        data: {
          tenantId: entry.tenantId,
          userId: entry.userId,
          provider: entry.provider || 'unknown',
          model: entry.model,
          promptTokens: Math.floor(entry.tokensUsed * 0.6),
          completionTokens: Math.floor(entry.tokensUsed * 0.4),
          totalTokens: entry.tokensUsed,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to log AI audit: ${(err as Error).message}`);
    }
  }
}
