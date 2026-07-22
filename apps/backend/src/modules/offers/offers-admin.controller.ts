import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminRolesGuard, AdminRoles } from '../../common/guards/admin-roles.guard';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/create-offer.dto';

@ApiTags('admin-offers')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, AdminRolesGuard)
@AdminRoles('SUPER_ADMIN')
@Controller('admin/tenants/:tenantId/offers')
export class OffersAdminController {
  constructor(private readonly offersService: OffersService) {}

  @ApiOperation({ summary: 'List offers for a tenant (super admin)' })
  @Get()
  findAll(@Param('tenantId') tenantId: string) {
    return this.offersService.findAll(tenantId);
  }

  @ApiOperation({ summary: 'Get one offer (super admin)' })
  @Get(':id')
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.offersService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Create offer (super admin)' })
  @Post()
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateOfferDto,
    @Request() req: any,
  ) {
    return this.offersService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Update offer (super admin)' })
  @Put(':id')
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offersService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Delete offer (super admin)' })
  @Delete(':id')
  @HttpCode(200)
  remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.offersService.remove(tenantId, id);
  }
}
