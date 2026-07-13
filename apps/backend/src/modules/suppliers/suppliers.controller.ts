import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List suppliers' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.suppliersService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.suppliersService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create supplier' })
  create(@CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.suppliersService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  update(@Param('id') id: string, @CurrentTenant() tenantId: string, @Body() dto: any) {
    return this.suppliersService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate supplier' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.suppliersService.remove(id, tenantId);
  }
}
