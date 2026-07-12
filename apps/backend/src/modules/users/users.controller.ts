import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.usersService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  create(@CurrentTenant() tenantId: string, @Body() data: any) {
    return this.usersService.create(tenantId, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: any,
  ) {
    return this.usersService.update(id, tenantId, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user' })
  remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.usersService.remove(id, tenantId);
  }
}
