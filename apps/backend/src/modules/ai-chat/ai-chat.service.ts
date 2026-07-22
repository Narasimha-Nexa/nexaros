import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LlmService } from './llm.service';
import { PromptBuilderService } from './prompt-builder.service';
import { ToolExecutorService } from './tool-executor.service';
import { RagService } from './rag.service';
import { MemoryService } from './memory.service';
import { GuardrailsService } from './guardrails.service';
import { PermissionsService } from './permissions.service';
import { AuditService } from './audit.service';
import { ChartService } from './chart.service';
import { ChatMessage } from './providers/llm-provider.interface';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private llm: LlmService,
    private promptBuilder: PromptBuilderService,
    private tools: ToolExecutorService,
    private rag: RagService,
    private memory: MemoryService,
    private guardrails: GuardrailsService,
    private permissions: PermissionsService,
    private audit: AuditService,
    private chartService: ChartService,
  ) {}

  private async getTenantContext(tenantId: string, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, timezone: true, currency: true },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, alerts, kpiAlerts] = await Promise.all([
      this.prisma.order.count({
        where: { tenantId, createdAt: { gte: today } },
      }),
      this.prisma.kpiAlert.findMany({
        where: { tenantId, status: 'open' },
        take: 5,
        select: { title: true, severity: true },
      }),
      this.prisma.dailyAnalyticsSnapshot.findFirst({
        where: { tenantId, date: { gte: today } },
        select: {
          grossRevenue: true, netRevenue: true, totalOrders: true,
          completedOrders: true, cancelledOrders: true, averageOrderValue: true,
          newCustomers: true, returningCustomers: true, foodCost: true, laborCost: true,
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const role = (await this.permissions.getUserRole(tenantId, userId)) || user?.role || 'OWNER';

    return {
      tenantName: tenant?.name || 'Restaurant',
      timezone: tenant?.timezone || 'UTC',
      currency: tenant?.currency || 'INR',
      role,
      todayOrders,
      alerts: alerts.map(a => `[${a.severity}] ${a.title}`).join('; ') || 'none',
      kpiSnapshot: kpiAlerts,
    };
  }

  private selectTools(question: string): string[] {
    const q = question.toLowerCase();
    const map: [string, string[]][] = [
      ['revenue', ['RevenueAnalyticsTool']],
      ['sales', ['RevenueAnalyticsTool']],
      ['income', ['RevenueAnalyticsTool']],
      ['profit', ['RevenueAnalyticsTool']],
      ['order', ['OrdersAnalyticsTool']],
      ['cancellation', ['OrdersAnalyticsTool']],
      ['prep', ['OrdersAnalyticsTool']],
      ['customer', ['CustomerAnalyticsTool']],
      ['retention', ['CustomerAnalyticsTool']],
      ['loyalty', ['CustomerAnalyticsTool']],
      ['churn', ['CustomerAnalyticsTool']],
      ['inventory', ['InventoryAnalyticsTool']],
      ['stock', ['InventoryAnalyticsTool']],
      ['waste', ['InventoryAnalyticsTool']],
      ['supply', ['InventoryAnalyticsTool']],
      ['purchase', ['InventoryAnalyticsTool']],
      ['forecast', ['ForecastTool']],
      ['predict', ['ForecastTool']],
      ['tomorrow', ['ForecastTool']],
      ['next week', ['ForecastTool']],
      ['branch', ['BranchComparisonTool']],
      ['store', ['BranchComparisonTool']],
      ['location', ['BranchComparisonTool']],
      ['staff', ['StaffAnalyticsTool']],
      ['employee', ['StaffAnalyticsTool']],
      ['shift', ['StaffAnalyticsTool']],
      ['labor', ['StaffAnalyticsTool']],
      ['payroll', ['StaffAnalyticsTool']],
      ['menu', ['MenuTool']],
      ['item', ['MenuTool']],
      ['dish', ['MenuTool']],
      ['food cost', ['MenuTool', 'RevenueAnalyticsTool']],
      ['reservation', ['ReservationTool']],
      ['booking', ['ReservationTool']],
      ['table', ['ReservationTool']],
      ['no-show', ['ReservationTool']],
      ['report', ['RevenueAnalyticsTool', 'OrdersAnalyticsTool', 'CustomerAnalyticsTool', 'InventoryAnalyticsTool']],
      ['weekly', ['RevenueAnalyticsTool', 'OrdersAnalyticsTool']],
      ['monthly', ['RevenueAnalyticsTool', 'OrdersAnalyticsTool']],
      ['daily', ['RevenueAnalyticsTool', 'OrdersAnalyticsTool']],
      ['generate', ['RevenueAnalyticsTool', 'OrdersAnalyticsTool', 'CustomerAnalyticsTool']],
      ['export', ['ExportReportTool']],
      ['pdf', ['ExportReportTool']],
      ['excel', ['ExportReportTool']],
      ['download', ['ExportReportTool']],
    ];

    const selected = new Set<string>();
    for (const [kw, tools] of map) {
      if (q.includes(kw)) tools.forEach(t => selected.add(t));
    }

    if (selected.size === 0) {
      selected.add('RevenueAnalyticsTool');
      selected.add('OrdersAnalyticsTool');
    }

    return [...selected];
  }

  async chat(
    tenantId: string,
    userId: string,
    conversationId: string | undefined,
    message: string,
  ): Promise<{ content: string; conversationId: string; chart: unknown; sources: unknown[]; followUps: string[] }> {
    if (!message?.trim()) throw new BadRequestException('Message is required');

    // Guardrails check
    const inputCheck = this.guardrails.validateInput(message);
    if (!inputCheck.safe) {
      return { content: inputCheck.reason || 'I cannot process this request.', conversationId: conversationId || '', chart: null, sources: [], followUps: [] };
    }

    // Restaurant relevance check (only for short queries)
    if (message.length < 100 && !this.guardrails.isRestaurantRelated(message)) {
      return {
        content: "I'm Nexa AI, your restaurant business copilot. I can help with revenue analysis, order trends, inventory management, forecasting, and more. What restaurant-related question can I help you with?",
        conversationId: conversationId || '',
        chart: null,
        sources: [],
        followUps: ['Show revenue trend', 'Forecast tomorrow', 'Top menu items', 'Inventory alerts'],
      };
    }

    // Create or reuse conversation
    let convId = conversationId;
    if (!convId) {
      const title = await this.memory.generateTitle(message);
      const conv = await this.prisma.aIConversation.create({
        data: { tenantId, userId, title },
      });
      convId = conv.id;
    }

    // Load history and context
    const history = await this.prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    const ctx = await this.getTenantContext(tenantId, userId);
    const memory = await this.memory.getMemory(convId);

    // RAG context retrieval
    const ragContext = await this.rag.retrieveRelevantContext(tenantId, message);

    // Execute relevant tools
    const toolNames = this.selectTools(message);
    const sources: unknown[] = [];
    const toolResults: string[] = [];

    for (const name of toolNames) {
      const startTime = Date.now();
      const exec = await this.tools.run(name, this.extractArgs(message), tenantId, userId);
      sources.push({ tool: name, durationMs: exec.durationMs });
      toolResults.push(`${name} => ${JSON.stringify(exec.result).slice(0, 2000)}`);

      await this.prisma.aIToolCall.create({
        data: {
          conversationId: convId,
          name,
          arguments: this.extractArgs(message) as never,
          result: exec.result as never,
          durationMs: exec.durationMs,
          status: (exec.result as Record<string, unknown>)?.error ? 'failed' : 'success',
        },
      });
    }

    const kpiSummary = toolResults.join('\n\n') || 'No live metrics available for this query.';

    // Build prompts with RAG context
    const systemPrompt = this.promptBuilder.buildSystemPrompt({
      ...ctx,
      kpiSummary,
      forecastSummary: 'Use ForecastTool for predictions.',
      toolSchema: this.tools.getToolSchema(),
      ragContext,
      currentTopic: memory.currentTopic,
    });
    const userPrompt = this.promptBuilder.buildUserPrompt(message, history, ragContext);

    // Stream LLM response
    let fullContent = '';
    const startMs = Date.now();

    try {
      const res = await this.llm.stream(
        {
          systemPrompt,
          messages: [{ role: 'user', content: userPrompt } as ChatMessage],
          temperature: 0.3,
          maxTokens: 2000,
          stream: true,
        },
        (token: string) => { fullContent += token; },
      );

      // Record usage
      await this.audit.log({
        tenantId,
        userId,
        action: 'chat',
        message: message.slice(0, 200),
        conversationId: convId,
        provider: this.llm.getProviders().find(p => p.isDefault)?.name || 'unknown',
        tokensUsed: res.usage.totalTokens,
        durationMs: Date.now() - startMs,
        toolsCalled: toolNames,
        success: true,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      fullContent = `⚠️ AI provider is not configured or encountered an error: ${errorMsg}.\n\nHere is the live data retrieved:\n${kpiSummary}\n\nTo enable AI responses, configure OPENAI_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY.`;
    }

    // Output guardrails
    const outputCheck = this.guardrails.validateOutput(fullContent);
    fullContent = outputCheck.sanitized;

    // Extract chart
    const chart = this.chartService.extractChartFromResponse(fullContent) || this.autoGenerateChart(toolNames, toolResults);

    // Generate follow-ups
    const followUps = await this.memory.getMemory(convId).then(m => m.followUpSuggestions);

    // Persist messages
    await this.prisma.aIMessage.create({
      data: { conversationId: convId, role: 'user', content: message },
    });
    await this.prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: 'assistant',
        content: fullContent,
        chart: chart as never,
        sources: sources as never,
      },
    });
    await this.prisma.aIConversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // Update memory
    await this.memory.updateMemory(convId, {
      currentTopic: memory.currentTopic,
      previousQuestions: [...memory.previousQuestions, message].slice(0, 5),
      lastToolUsed: toolNames[0],
    });

    return { content: fullContent, conversationId: convId, chart, sources, followUps };
  }

  async *streamChat(
    tenantId: string,
    userId: string,
    conversationId: string | undefined,
    message: string,
  ): AsyncGenerator<string, void, unknown> {
    const result = await this.chat(tenantId, userId, conversationId, message);

    // Stream token by token for live feel
    const tokens = result.content.match(/\S+\s*|\s+/g) || [result.content];
    for (const t of tokens) {
      yield `data: ${JSON.stringify({ token: t })}\n\n`;
    }

    yield `data: ${JSON.stringify({
      done: true,
      conversationId: result.conversationId,
      chart: result.chart,
      followUps: result.followUps,
    })}\n\n`;
  }

  private extractArgs(message: string): Record<string, unknown> {
    const args: Record<string, unknown> = {};
    const horizon = message.match(/(\d+)\s*(day|week|month)/i);
    if (horizon) {
      args.horizon = horizon[1] === 'week' ? 7 : horizon[1] === 'month' ? 30 : Number(horizon[1]);
    }
    if (message.includes('tomorrow')) args.horizon = 1;
    if (message.includes('next week')) args.horizon = 7;
    if (message.includes('next month')) args.horizon = 30;

    const metricMatch = message.match(/revenue|orders|staffing|inventory/i);
    if (metricMatch) args.metric = metricMatch[0].toLowerCase();

    const formatMatch = message.match(/pdf|excel|csv/i);
    if (formatMatch) args.format = formatMatch[0].toLowerCase();

    return args;
  }

  private autoGenerateChart(toolNames: string[], toolResults: string[]): unknown {
    for (let i = 0; i < toolNames.length; i++) {
      try {
        const data = JSON.parse(toolResults[i]?.replace(/^[^=]*=> /, '') || '{}');
        const chart = this.chartService.autoGenerateChart(toolNames[i], data);
        if (chart) return chart;
      } catch {
        // ignore
      }
    }
    return null;
  }

  async listConversations(tenantId: string, userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { tenantId, userId, deletedAt: null },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      take: 50,
      select: {
        id: true, title: true, pinned: true, summary: true,
        createdAt: true, updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  async getConversation(tenantId: string, userId: string, id: string) {
    return this.prisma.aIConversation.findFirst({
      where: { id, tenantId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        toolCalls: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async deleteConversation(tenantId: string, userId: string, id: string) {
    await this.prisma.aIConversation.updateMany({
      where: { id, tenantId, userId },
      data: { deletedAt: new Date() },
    });
    await this.memory.clearMemory(id);
    return { success: true };
  }

  async pinConversation(tenantId: string, userId: string, id: string, pinned: boolean) {
    await this.prisma.aIConversation.updateMany({
      where: { id, tenantId, userId },
      data: { pinned },
    });
    return { success: true, pinned };
  }

  async renameConversation(tenantId: string, userId: string, id: string, title: string) {
    await this.prisma.aIConversation.updateMany({
      where: { id, tenantId, userId },
      data: { title: title.slice(0, 100) },
    });
    return { success: true };
  }

  async searchConversations(tenantId: string, userId: string, query: string) {
    const lower = query.toLowerCase();
    return this.prisma.aIConversation.findMany({
      where: {
        tenantId, userId, deletedAt: null,
        OR: [
          { title: { contains: lower, mode: 'insensitive' as never } },
          { messages: { some: { content: { contains: lower, mode: 'insensitive' as never } } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, title: true, updatedAt: true },
    });
  }

  getSuggestions(): string[] {
    return [
      'Why is revenue down today?',
      'Forecast tomorrow\'s demand',
      'Top menu items this week',
      'Inventory alerts',
      'Best performing branch',
      'Generate weekly report',
      'Customer retention rate',
      'Kitchen bottlenecks',
      'Food cost trend',
      'Labor cost analysis',
      'No-show percentage',
      'Peak ordering hour',
      'Compare this month with last month',
      'Staff performance ranking',
      'Payment method breakdown',
    ];
  }

  getProviders() {
    return this.llm.getProviders();
  }
}
