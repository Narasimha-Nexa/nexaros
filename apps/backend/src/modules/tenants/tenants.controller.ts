import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List tenants with search, filters, sorting, pagination' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('country') country?: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('businessType') businessType?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.tenantsService.findAll({
      page: page || 1,
      limit: Math.min(limit || 20, 100),
      search, status, plan, country, state, city, businessType, sortBy, sortDir,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get tenant dashboard statistics' })
  async getStats() {
    return this.tenantsService.getStats();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export tenants as CSV or JSON' })
  async export(
    @Query('format') format: 'csv' | 'json',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    return this.tenantsService.exportTenants(format || 'csv', {
      search: search || '',
      status: status || '',
      plan: plan || '',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'List users belonging to a tenant' })
  async listUsers(@Param('id') id: string) {
    return this.tenantsService.listUsers(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a tenant and all its data' })
  async delete(@Param('id') id: string) {
    return this.tenantsService.hardDelete(id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Update tenant status (active/suspended/archived)' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tenantsService.updateStatus(id, status);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend a tenant' })
  async suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a tenant' })
  async activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a tenant' })
  async archive(@Param('id') id: string) {
    return this.tenantsService.archive(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore an archived tenant' })
  async restore(@Param('id') id: string) {
    return this.tenantsService.restore(id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk actions on tenants' })
  async bulkAction(@Body() body: { ids: string[]; action: string }) {
    return this.tenantsService.bulkAction(body.ids, body.action);
  }
}
