import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { isPrimary: 'desc' },
      include: {
        _count: { select: { staff: true, orders: true, tables: true } },
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: { select: { staff: true, orders: true, tables: true } },
        tenant: { select: { name: true, slug: true, subdomain: true } },
        staff: {
          select: { id: true, name: true, role: { select: { name: true } }, status: true },
          where: { deletedAt: null },
          take: 10,
        },
      },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(tenantId: string, dto: CreateBranchDto, adminUserId?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscriptions: { where: { status: 'ACTIVE' }, include: { plan: true } } },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Check branch limit from the tenant-level subscription plan
    const activeSub = tenant?.subscriptions?.[0];
    if (activeSub?.plan?.maxBranches) {
      const currentCount = await this.prisma.branch.count({ where: { tenantId, deletedAt: null } });
      if (currentCount >= activeSub.plan.maxBranches) {
        throw new BadRequestException(
          `Branch limit reached (${activeSub.plan.maxBranches}). Upgrade your plan to add more branches.`,
        );
      }
    }

    // Check branch code uniqueness within tenant
    if (dto.code) {
      const existing = await this.prisma.branch.findFirst({
        where: { tenantId, code: dto.code, deletedAt: null },
      });
      if (existing) throw new BadRequestException(`Branch code "${dto.code}" already exists for this tenant`);
    }

    const branch = await this.prisma.branch.create({
      data: {
        ...dto,
        tenantId,
        branchType: (dto.branchType as any) || 'PRIMARY',
        status: 'ACTIVE',
        isActive: true,
        createdBy: adminUserId,
      },
    });

    return branch;
  }

  async update(id: string, tenantId: string, dto: UpdateBranchDto) {
    await this.findOne(id, tenantId);

    if (dto.code) {
      const existing = await this.prisma.branch.findFirst({
        where: { tenantId, code: dto.code, deletedAt: null, NOT: { id } },
      });
      if (existing) throw new BadRequestException(`Branch code "${dto.code}" already exists for this tenant`);
    }

    const { branchType, status, ...rest } = dto;
    return this.prisma.branch.update({
      where: { id },
      data: {
        ...rest,
        ...(branchType ? { branchType: branchType as any } : {}),
        ...(status ? { status: status as any } : {}),
      },
    });
  }

  async updateStatus(id: string, tenantId: string, status: string) {
    await this.findOne(id, tenantId);

    const data: any = {};
    if (status === 'ACTIVE' || status === 'active') {
      data.status = 'ACTIVE';
      data.isActive = true;
    } else if (status === 'PAUSED' || status === 'paused') {
      data.status = 'PAUSED';
      data.isActive = false;
    } else if (status === 'CLOSED' || status === 'closed') {
      data.status = 'CLOSED';
      data.isActive = false;
    } else if (status === 'ARCHIVED' || status === 'archived') {
      data.status = 'ARCHIVED';
      data.isActive = false;
      data.archivedAt = new Date();
    } else {
      throw new BadRequestException(`Invalid status: ${status}`);
    }

    return this.prisma.branch.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    const branch = await this.findOne(id, tenantId);
    if (branch.isPrimary) throw new BadRequestException('Cannot delete the primary branch');
    return this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: 'ARCHIVED' },
    });
  }
}
