import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  CreateWorkflowRequestDto,
  DecisionDto,
} from './dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@ApiTags('admin-workflows')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/workflows')
export class AdminWorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  private requireTenant(tenantId: string | undefined): string {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new BadRequestException('tenantId query parameter is required');
    }
    return tenantId;
  }

  // ── Templates ──

  @Get('templates')
  @ApiOperation({ summary: 'List workflow templates (admin)' })
  @ApiQuery({ name: 'tenantId', required: true })
  async listTemplates(@Query('tenantId') tenantId: string) {
    return this.workflowsService.listTemplates(this.requireTenant(tenantId));
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create workflow template (admin)' })
  async createTemplate(@Body() body: CreateWorkflowTemplateDto & { tenantId: string }) {
    return this.workflowsService.createTemplate(this.requireTenant(body.tenantId), body);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update workflow template (admin)' })
  @ApiQuery({ name: 'tenantId', required: true })
  async updateTemplate(@Query('tenantId') tenantId: string, @Param('id') id: string, @Body() body: UpdateWorkflowTemplateDto) {
    return this.workflowsService.updateTemplate(this.requireTenant(tenantId), id, body);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete workflow template (admin)' })
  @ApiQuery({ name: 'tenantId', required: true })
  async deleteTemplate(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.workflowsService.deleteTemplate(this.requireTenant(tenantId), id);
  }

  // ── Requests ──

  @Post('requests')
  @ApiOperation({ summary: 'Create workflow request (admin)' })
  async createRequest(
    @Request() req: any,
    @Body() body: CreateWorkflowRequestDto & { tenantId: string },
  ) {
    return this.workflowsService.createRequest(this.requireTenant(body.tenantId), {
      ...body,
      requestedBy: req.admin?.id || 'system',
    });
  }

  @Get('requests')
  @ApiOperation({ summary: 'List workflow requests (admin)' })
  @ApiQuery({ name: 'tenantId', required: true })
  @ApiQuery({ name: 'status', required: false })
  async listRequests(@Query('tenantId') tenantId: string, @Query('status') status?: string) {
    return this.workflowsService.listRequests(this.requireTenant(tenantId), status);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get workflow request (admin)' })
  @ApiQuery({ name: 'tenantId', required: true })
  async getRequest(@Query('tenantId') tenantId: string, @Param('id') id: string) {
    return this.workflowsService.getRequest(this.requireTenant(tenantId), id);
  }

  @Post('requests/:id/approve')
  @ApiOperation({ summary: 'Approve workflow request (admin)' })
  @ApiQuery({ name: 'tenantId', required: true })
  async approveRequest(
    @Request() req: any,
    @Query('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() body: DecisionDto,
  ) {
    return this.workflowsService.approveRequest(this.requireTenant(tenantId), id, req.admin.id, body.notes, req.admin.role);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'Reject workflow request (admin)' })
  @ApiQuery({ name: 'tenantId', required: true })
  async rejectRequest(
    @Request() req: any,
    @Query('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() body: DecisionDto,
  ) {
    return this.workflowsService.rejectRequest(this.requireTenant(tenantId), id, req.admin.id, body.notes, req.admin.role);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get workflow stats (admin)' })
  @ApiQuery({ name: 'tenantId', required: true })
  async getStats(@Query('tenantId') tenantId: string) {
    return this.workflowsService.getStats(this.requireTenant(tenantId));
  }
}
