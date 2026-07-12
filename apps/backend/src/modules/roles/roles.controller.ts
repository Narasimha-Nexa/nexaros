import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all roles' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.rolesService.findAll(tenantId);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all available permissions' })
  getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by ID' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.rolesService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  create(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.rolesService.create(tenantId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update role' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: any,
  ) {
    return this.rolesService.update(id, tenantId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.rolesService.remove(id, tenantId);
  }
}
