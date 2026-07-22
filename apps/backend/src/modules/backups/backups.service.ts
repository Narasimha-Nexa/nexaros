import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const AVAILABLE_TABLES = [
  'tenants',
  'branches',
  'users',
  'roles',
  'permissions',
  'staff',
  'categories',
  'menu_items',
  'restaurant_tables',
  'orders',
  'order_items',
  'payments',
  'invoices',
  'inventory_items',
  'suppliers',
  'purchases',
  'reservations',
  'shifts',
  'subscriptions',
  'feature_flags',
  'tenant_feature_flags',
  'coupons',
  'customers',
  'reviews',
  'campaigns',
  'support_tickets',
];

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private readonly backupsDir = path.resolve('./backups');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  async triggerBackup(
    adminUserId: string,
    data?: { name?: string; tables?: string[]; type?: string },
  ) {
    const startTime = Date.now();
    const backupName =
      data?.name || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupType = data?.type || 'MANUAL';
    const tablesToBackup =
      data?.tables && data.tables.length > 0
        ? data.tables.filter((t) => AVAILABLE_TABLES.includes(t))
        : AVAILABLE_TABLES;

    if (tablesToBackup.length === 0) {
      throw new NotFoundException('No valid tables specified for backup');
    }

    const backup = await this.prisma.backup.create({
      data: {
        name: backupName,
        type: backupType,
        status: 'IN_PROGRESS',
        tables: tablesToBackup,
        createdBy: adminUserId,
      },
    });

    try {
      const backupData: Record<string, any[]> = {};
      const recordCounts: Record<string, number> = {};

      for (const tableName of tablesToBackup) {
        try {
          const rows = await this.exportTableData(tableName);
          backupData[tableName] = rows;
          recordCounts[tableName] = rows.length;
        } catch (err) {
          this.logger.error(`Failed to export table ${tableName}: ${err.message}`);
          backupData[tableName] = [];
          recordCounts[tableName] = 0;
        }
      }

      const filePath = path.join(this.backupsDir, `${backup.id}.json`);
      const fileContent = JSON.stringify(
        {
          backupId: backup.id,
          name: backupName,
          type: backupType,
          exportedAt: new Date().toISOString(),
          tables: backupData,
        },
        null,
        2,
      );

      fs.writeFileSync(filePath, fileContent, 'utf-8');
      const stats = fs.statSync(filePath);
      const duration = Date.now() - startTime;
      const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);

      return this.prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: 'COMPLETED',
          recordCount: recordCounts,
          fileSize: `${(stats.size / 1024).toFixed(2)} KB`,
          storagePath: filePath,
          duration,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      this.logger.error(`Backup failed: ${err.message}`);

      return this.prisma.backup.update({
        where: { id: backup.id },
        data: {
          status: 'FAILED',
          error: err.message,
          duration,
        },
      });
    }
  }

  async listBackups(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [backups, total] = await Promise.all([
      this.prisma.backup.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.backup.count(),
    ]);

    return {
      data: backups,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBackup(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) {
      throw new NotFoundException('Backup not found');
    }
    return backup;
  }

  async deleteBackup(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) {
      throw new NotFoundException('Backup not found');
    }

    if (backup.storagePath && fs.existsSync(backup.storagePath)) {
      fs.unlinkSync(backup.storagePath);
    }

    return this.prisma.backup.delete({ where: { id } });
  }

  async getBackupStats() {
    const totalBackups = await this.prisma.backup.count();
    const latestBackup = await this.prisma.backup.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const completedBackups = await this.prisma.backup.findMany({
      where: { status: 'COMPLETED' },
      select: { fileSize: true, type: true },
    });

    let totalSizeKB = 0;
    const typeCounts: Record<string, number> = {};

    for (const b of completedBackups) {
      if (b.fileSize) {
        const match = b.fileSize.match(/([\d.]+)\s*KB/);
        if (match) {
          totalSizeKB += parseFloat(match[1]);
        }
      }
      typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
    }

    return {
      totalBackups,
      latestBackupTime: latestBackup?.createdAt || null,
      totalSize: `${totalSizeKB.toFixed(2)} KB`,
      backupTypes: typeCounts,
    };
  }

  async exportTableData(tableName: string) {
    if (!AVAILABLE_TABLES.includes(tableName)) {
      throw new Error(`Table "${tableName}" is not in the allowed backup list`);
    }
    const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    if (safeName !== tableName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(safeName)) {
      throw new Error(`Invalid table name: "${tableName}"`);
    }
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM "${safeName}"`,
    );
    return rows;
  }
}
