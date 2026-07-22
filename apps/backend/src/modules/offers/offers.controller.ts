import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/roles.decorator';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/create-offer.dto';

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  // ── Public (by slug, unauthenticated) ──

  @ApiOperation({ summary: 'Get active offers for a tenant by slug' })
  @Get('public/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.offersService.getPublicBySlug(slug);
  }

  // ── Owner (tenant-scoped, protected) ──

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('offers:read')
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.offersService.findAll(tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('offers:read')
  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.offersService.findOne(tenantId, id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('offers:write')
  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateOfferDto) {
    return this.offersService.create(tenantId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('offers:write')
  @Put(':id')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.offersService.update(tenantId, id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('offers:delete')
  @Delete(':id')
  @HttpCode(200)
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.offersService.remove(tenantId, id);
  }
}
