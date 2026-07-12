import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant details' })
  async getCurrent(@CurrentTenant() tenantId: string) {
    return this.tenantsService.findOne(tenantId);
  }

  @Patch('current')
  @ApiOperation({ summary: 'Update current tenant details' })
  async updateCurrent(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.tenantsService.update(tenantId, data);
  }
}
