import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

interface ConversationMemory {
  currentTopic: string;
  selectedBranch?: string;
  selectedDateRange?: { from: string; to: string };
  previousQuestions: string[];
  lastToolUsed?: string;
  followUpSuggestions: string[];
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly MEMORY_TTL = 3600;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getMemory(conversationId: string): Promise<ConversationMemory> {
    const cacheKey = `ai:memory:${conversationId}`;
    const cached = await this.redis.get<ConversationMemory>(cacheKey);
    if (cached) return cached;

    const messages = await this.prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { role: true, content: true },
    });

    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
    const memory: ConversationMemory = {
      currentTopic: this.detectTopic(userMessages[0] || ''),
      previousQuestions: userMessages.slice(0, 5),
      followUpSuggestions: this.generateFollowUps(userMessages[0] || ''),
    };

    await this.redis.set(cacheKey, memory, this.MEMORY_TTL);
    return memory;
  }

  async updateMemory(conversationId: string, update: Partial<ConversationMemory>): Promise<void> {
    const existing = await this.getMemory(conversationId);
    const merged = { ...existing, ...update };
    await this.redis.set(`ai:memory:${conversationId}`, merged, this.MEMORY_TTL);
  }

  async clearMemory(conversationId: string): Promise<void> {
    await this.redis.del(`ai:memory:${conversationId}`);
  }

  private detectTopic(message: string): string {
    const lower = message.toLowerCase();
    if (lower.match(/revenue|sales|income/)) return 'revenue';
    if (lower.match(/order|delivery|takeaway/)) return 'orders';
    if (lower.match(/customer|retention|loyalty/)) return 'customers';
    if (lower.match(/inventory|stock|waste/)) return 'inventory';
    if (lower.match(/forecast|predict|tomorrow/)) return 'forecast';
    if (lower.match(/branch|store|location/)) return 'branches';
    if (lower.match(/staff|employee|shift/)) return 'staff';
    if (lower.match(/menu|item|dish/)) return 'menu';
    if (lower.match(/reservation|booking|table/)) return 'reservations';
    if (lower.match(/report|summary|weekly/)) return 'reports';
    return 'general';
  }

  private generateFollowUps(lastQuestion: string): string[] {
    const topic = this.detectTopic(lastQuestion);
    const followUps: Record<string, string[]> = {
      revenue: ['Compare with last month', 'Revenue by branch', 'Why is revenue down?', 'Forecast next week'],
      orders: ['Peak ordering hour', 'Average prep time', 'Order cancellation reasons', 'Delivery vs dine-in'],
      customers: ['Top customers', 'Customer retention rate', 'New customer growth', 'Customer satisfaction'],
      inventory: ['Low stock items', 'Waste this week', 'Top suppliers', 'Restock recommendations'],
      forecast: ['Revenue forecast', 'Order volume prediction', 'Staffing needs', 'Inventory demand'],
      branches: ['Best performing branch', 'Branch revenue comparison', 'Branch efficiency', 'Staff per branch'],
      staff: ['Sales per employee', 'Highest performing staff', 'Shift efficiency', 'Labor cost trend'],
      menu: ['Top selling items', 'Least popular items', 'Menu profitability', 'Combo suggestions'],
      reservations: ['No-show percentage', 'Peak reservation times', 'Table utilization', 'Booking trends'],
      reports: ['Daily summary', 'Weekly KPIs', 'Monthly trends', 'Quarterly comparison'],
    };
    return followUps[topic] || ['Show revenue trend', 'Forecast tomorrow', 'Top menu items', 'Inventory alerts'];
  }

  async generateTitle(message: string): Promise<string> {
    const words = message.split(/\s+/).slice(0, 6);
    return words.join(' ');
  }
}
