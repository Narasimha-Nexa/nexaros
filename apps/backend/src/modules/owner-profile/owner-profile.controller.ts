import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OwnerProfileService } from './owner-profile.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('Owner Profiles')
@Controller('owner-profiles')
export class OwnerProfileController {
  constructor(private readonly ownerProfileService: OwnerProfileService) {}

  @Get()
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all owner profiles (super admin)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.ownerProfileService.findAll({ page, limit, search });
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get owner profile by ID' })
  async findById(@Param('id') id: string) {
    return this.ownerProfileService.findById(id);
  }

  @Get('email/:email')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find owner by email' })
  async findByEmail(@Param('email') email: string) {
    const owner = await this.ownerProfileService.findByEmail(email);
    if (!owner) throw new NotFoundException('Owner not found');
    return owner;
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create owner profile (super admin)' })
  async create(@Body() body: { email: string; name: string; phone?: string; password?: string }) {
    return this.ownerProfileService.create(body);
  }

  @Patch(':id/deactivate')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate owner profile' })
  async deactivate(@Param('id') id: string) {
    return this.ownerProfileService.deactivate(id);
  }

  @Patch(':id/reactivate')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate owner profile' })
  async reactivate(@Param('id') id: string) {
    return this.ownerProfileService.reactivate(id);
  }
}
