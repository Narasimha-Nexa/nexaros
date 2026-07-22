import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { FaqsService } from './faqs.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/create-faq.dto';

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('faqs:read')
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.faqsService.findAll(tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('faqs:write')
  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateFaqDto) {
    return this.faqsService.create(tenantId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('faqs:write')
  @Put(':id')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.faqsService.update(tenantId, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('faqs:write')
  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.faqsService.remove(tenantId, id);
  }
}
