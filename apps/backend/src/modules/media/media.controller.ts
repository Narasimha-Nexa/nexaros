import {
  Controller, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminRolesGuard, AdminRoles } from '../../common/guards/admin-roles.guard';

/**
 * Generic media API contract. The upload implementation is intentionally a stub
 * in Phase 4 — the Website Management UI stores image URLs directly. In Phase 6
 * this controller's internals will be swapped to MinIO/S3 without changing the
 * route contract or the frontend MediaService interface.
 */
@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  @ApiOperation({ summary: 'Upload a media asset (stub — MinIO arrives in Phase 6)' })
  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'ADMIN')
  @Post('upload')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  upload() {
    return {
      error: 'NOT_IMPLEMENTED',
      message:
        'Media upload is not yet available. Store image URLs directly; MinIO/S3 integration arrives in Phase 6.',
    };
  }

  @ApiOperation({ summary: 'Delete a media asset (stub)' })
  @UseGuards(AdminAuthGuard, AdminRolesGuard)
  @AdminRoles('SUPER_ADMIN', 'ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  remove(@Param('id') _id: string) {
    return {
      error: 'NOT_IMPLEMENTED',
      message: 'Media delete is not yet available (Phase 6).',
    };
  }
}
