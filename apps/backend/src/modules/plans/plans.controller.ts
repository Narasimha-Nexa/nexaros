import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all plans for tenant' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.plansService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan details' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.plansService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new plan' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreatePlanDto) {
    return this.plansService.create(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.plansService.remove(id, tenantId);
  }
}
