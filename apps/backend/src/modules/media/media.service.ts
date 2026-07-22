import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif',
  'video/mp4', 'video/webm',
  'application/pdf',
]);

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async upload(tenantId: string, file: Express.Multer.File, folder?: string, tags?: string[]) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_FILE_SIZE) throw new BadRequestException('File exceeds 10MB limit');
    if (!ALLOWED_TYPES.has(file.mimetype)) throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);

    const ext = path.extname(file.originalname);
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const targetDir = path.join(UPLOAD_DIR, tenantId, folder || '');
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const filePath = path.join(targetDir, uniqueName);
    fs.writeFileSync(filePath, file.buffer);

    const url = `/uploads/${tenantId}/${folder || ''}${folder && !folder.endsWith('/') ? '/' : ''}${uniqueName}`;

    const asset = await this.prisma.mediaAsset.create({
      data: {
        tenantId,
        filename: uniqueName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        folder: folder || '/',
        tags: tags || [],
        createdBy: tenantId,
      },
    });

    return asset;
  }

  async findAll(tenantId: string, opts?: { folder?: string; mime?: string; search?: string; page?: number; limit?: number }) {
    const page = opts?.page || 1;
    const limit = Math.min(opts?.limit || 50, 200);
    const where: any = { tenantId, deletedAt: null };
    if (opts?.folder) where.folder = opts.folder;
    if (opts?.mime) where.mimeType = { contains: opts.mime };
    if (opts?.search) {
      where.OR = [
        { originalName: { contains: opts.search, mode: 'insensitive' } },
        { tags: { has: opts.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(tenantId: string, id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset;
  }

  async remove(tenantId: string, id: string) {
    const asset = await this.findOne(tenantId, id);
    const filePath = path.join(process.cwd(), asset.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await this.prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async getFolders(tenantId: string) {
    const results = await this.prisma.mediaAsset.groupBy({
      by: ['folder'],
      where: { tenantId, deletedAt: null },
      _count: { id: true },
    });
    return results.map((r) => ({ folder: r.folder, count: r._count.id }));
  }
}
