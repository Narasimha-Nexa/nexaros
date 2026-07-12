import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all branches' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.branchesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.branchesService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  create(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.branchesService.create(tenantId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: any,
  ) {
    return this.branchesService.update(id, tenantId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete branch' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.branchesService.remove(id, tenantId);
  }
}
