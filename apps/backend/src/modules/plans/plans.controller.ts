import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('plans')
@ApiBearerAuth()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all platform plans' })
  findAll() {
    return this.plansService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get plan details' })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Create a new platform plan' })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Admin: update a plan (price, limits)' })
  adminUpdate(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a plan' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Delete a plan' })
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
