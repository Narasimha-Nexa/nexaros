import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LlmService } from './llm.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ToolExecutorService } from './tool-executor.service';
import { ChartService } from './chart.service';
import { ChatMessage } from './providers/llm-provider.interface';

@Injectable()
export class AiReportService {
  private readonly logger = new Logger(AiReportService.name);

  constructor(
    private prisma: PrismaService,
    private llm: LlmService,
    private promptBuilder: PromptBuilderService,
    private tools: ToolExecutorService,
    private chartService: ChartService,
  ) {}

  async generate(
    tenantId: string,
    userId: string,
    type: string,
    period: { from?: string; to?: string },
  ): Promise<{ content: string; reportId: string }> {
    const from = new Date(period.from || new Date(Date.now() - 7 * 864e5));
    const to = new Date(period.to || new Date());
    const args = { from: period.from, to: period.to };

    const toolsToRun = ['RevenueAnalyticsTool', 'OrdersAnalyticsTool', 'CustomerAnalyticsTool', 'InventoryAnalyticsTool'];
    if (type === 'branch') toolsToRun.push('BranchComparisonTool');
    if (type === 'menu') toolsToRun.push('MenuTool');
    if (type === 'staff') toolsToRun.push('StaffAnalyticsTool');
    if (type === 'reservation') toolsToRun.push('ReservationTool');

    const data: Record<string, unknown> = {};
    for (const name of toolsToRun) {
      const exec = await this.tools.run(name, args, tenantId, userId);
      data[name] = exec.result;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    const userPrompt = this.promptBuilder.buildReportPrompt(type, data, {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    });

    const systemPrompt = this.promptBuilder.buildSystemPrompt({
      tenantName: tenant?.name || 'Restaurant',
      timezone: 'UTC',
      currency: 'INR',
      role: 'OWNER',
      todayOrders: 0,
      alerts: 'see data',
      kpiSummary: JSON.stringify(data).slice(0, 3000),
      forecastSummary: '',
      toolSchema: [],
    });

    let content = '';
    try {
      const res = await this.llm.complete({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt } as ChatMessage],
        temperature: 0.4,
        maxTokens: 3000,
      });
      content = res.content;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      content = `⚠️ AI provider not configured: ${msg}\n\n--- Raw Data ---\n${JSON.stringify(data, null, 2).slice(0, 3000)}`;
    }

    const report = await this.prisma.aIReport.create({
      data: {
        tenantId,
        userId,
        type,
        periodFrom: from,
        periodTo: to,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report — ${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}`,
        content,
        status: 'completed',
      },
    });

    return { content, reportId: report.id };
  }

  async list(tenantId: string, userId: string) {
    return this.prisma.aIReport.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
