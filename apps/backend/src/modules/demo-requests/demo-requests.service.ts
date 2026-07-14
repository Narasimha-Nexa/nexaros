import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DemoRequestsService {
  private readonly logger = new Logger(DemoRequestsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: {
    restaurantName: string;
    contactName: string;
    email: string;
    phone: string;
    city?: string;
    state?: string;
    currentPos?: string;
    message?: string;
    source?: string;
  }) {
    const request = await this.prisma.demoRequest.create({ data });
    this.logger.log(`New demo request: ${data.restaurantName} (${data.email})`);
    return request;
  }

  async findAll(page = 1, limit = 50, status?: string) {
    const where = status ? { status: status as any } : {};
    const [requests, total] = await Promise.all([
      this.prisma.demoRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.demoRequest.count({ where }),
    ]);
    return { requests, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const request = await this.prisma.demoRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demo request not found');
    return request;
  }

  async updateStatus(
    id: string,
    status: string,
    options?: { assignedTo?: string; notes?: string },
  ) {
    const request = await this.prisma.demoRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demo request not found');

    return this.prisma.demoRequest.update({
      where: { id },
      data: {
        status: status as any,
        assignedTo: options?.assignedTo,
        notes: options?.notes,
      },
    });
  }

  async getStats() {
    const [total, newCount, contacted, scheduled, converted, lost] = await Promise.all([
      this.prisma.demoRequest.count(),
      this.prisma.demoRequest.count({ where: { status: 'NEW' } }),
      this.prisma.demoRequest.count({ where: { status: 'CONTACTED' } }),
      this.prisma.demoRequest.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.demoRequest.count({ where: { status: 'CONVERTED' } }),
      this.prisma.demoRequest.count({ where: { status: 'LOST' } }),
    ]);

    return {
      total,
      pipeline: { new: newCount, contacted, scheduled, converted, lost },
      conversionRate: total > 0 ? ((converted / total) * 100).toFixed(1) : '0',
    };
  }
}
