import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private prisma: PrismaService) {}

  async createTicket(data: {
    tenantId: string;
    subject: string;
    description: string;
    priority?: string;
  }) {
    return this.prisma.supportTicket.create({
      data: {
        ...data,
        priority: (data.priority as any) || 'NORMAL',
      },
    });
  }

  async findAll(page = 1, limit = 50, filters?: { status?: string; priority?: string; tenantId?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.tenantId) where.tenantId = filters.tenantId;

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);
    return { tickets, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async addMessage(ticketId: string, data: {
    senderType: string;
    senderId: string;
    message: string;
    isInternal?: boolean;
  }) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderType: data.senderType as any,
        senderId: data.senderId,
        message: data.message,
        isInternal: data.isInternal ?? false,
      },
    });
  }

  async updateStatus(id: string, status: string, assignedTo?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: status as any,
        assignedTo,
      },
    });
  }

  async getStats() {
    const [total, open, inProgress, waitingCustomer, resolved, closed] = await Promise.all([
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({ where: { status: 'WAITING_CUSTOMER' } }),
      this.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    ]);

    const priorities = await this.prisma.supportTicket.groupBy({
      by: ['priority'],
      _count: { id: true },
      where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
    });

    return {
      total,
      byStatus: { open, inProgress, waitingCustomer, resolved, closed },
      byPriority: priorities.map((p) => ({ priority: p.priority, count: p._count.id })),
      active: open + inProgress + waitingCustomer,
    };
  }
}
