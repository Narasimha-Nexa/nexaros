import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@ApiTags('Support Tickets')
@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket (customer)' })
  async createTicket(@Body() dto: CreateSupportTicketDto) {
    return this.supportService.createTicket(dto);
  }

  @Get('tickets')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all support tickets (Admin)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.supportService.findAll(page || 1, limit || 50, { status, priority, tenantId });
  }

  @Get('tickets/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket details with messages' })
  async findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Post('tickets/:id/messages')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add message to ticket' })
  async addMessage(
    @Param('id') id: string,
    @Body() body: { senderType: string; senderId: string; message: string; isInternal?: boolean },
  ) {
    return this.supportService.addMessage(id, body);
  }

  @Put('tickets/:id/status')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; assignedTo?: string },
  ) {
    return this.supportService.updateStatus(id, body.status, body.assignedTo);
  }

  @Get('admin/stats')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get support stats (Admin)' })
  async getStats() {
    return this.supportService.getStats();
  }
}
