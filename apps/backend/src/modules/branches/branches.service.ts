import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      orderBy: { isPrimary: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(tenantId: string, dto: CreateBranchDto) {
    // Check plan limits
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true } } },
    });
    const activeSub = tenant?.subscriptions?.[0];
    if (activeSub?.plan?.maxBranches) {
      const currentCount = await this.prisma.branch.count({ where: { tenantId, isActive: true } });
      if (currentCount >= activeSub.plan.maxBranches) {
        throw new BadRequestException(
          `Branch limit reached (${activeSub.plan.maxBranches}). Upgrade your plan to add more branches.`,
        );
      }
    }

    return this.prisma.branch.create({
      data: { ...dto, tenantId },
    });
  }

  async update(id: string, tenantId: string, dto: UpdateBranchDto) {
    await this.findOne(id, tenantId);
    return this.prisma.branch.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.branch.delete({ where: { id } });
  }
}
