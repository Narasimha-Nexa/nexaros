import {
  Controller, Post, Get, Delete, Param, Query, UseGuards, UseInterceptors,
  UploadedFile, HttpCode, HttpStatus, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminRolesGuard, AdminRoles } from '../../common/guards/admin-roles.guard';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: 'Upload a media asset' })
  @AdminRoles('SUPER_ADMIN', 'ADMIN')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        tenantId: { type: 'string' },
        folder: { type: 'string' },
        tags: { type: 'string' },
      },
      required: ['file', 'tenantId'],
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('tenantId') tenantId: string,
    @Body('folder') folder?: string,
    @Body('tags') tags?: string,
  ) {
    const tagList = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const asset = await this.mediaService.upload(tenantId, file, folder, tagList);
    return { data: asset };
  }

  @ApiOperation({ summary: 'List media assets' })
  @AdminRoles('SUPER_ADMIN', 'ADMIN')
  @Get()
  async findAll(
    @Query('tenantId') tenantId: string,
    @Query('folder') folder?: string,
    @Query('mime') mime?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mediaService.findAll(tenantId, {
      folder, mime, search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @ApiOperation({ summary: 'Get media folders' })
  @AdminRoles('SUPER_ADMIN', 'ADMIN')
  @Get('folders')
  async getFolders(@Query('tenantId') tenantId: string) {
    return this.mediaService.getFolders(tenantId);
  }

  @ApiOperation({ summary: 'Delete a media asset' })
  @AdminRoles('SUPER_ADMIN', 'ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.mediaService.remove(tenantId, id);
  }
}
