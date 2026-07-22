import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import {
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  CreateWorkflowRequestDto,
  DecisionDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post('templates')
  @ApiOperation({ summary: 'Create workflow template' })
  createTemplate(
    @CurrentTenant() tenantId: string,
    @Body() data: CreateWorkflowTemplateDto,
  ) {
    return this.workflowsService.createTemplate(tenantId, data);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List workflow templates' })
  listTemplates(@CurrentTenant() tenantId: string) {
    return this.workflowsService.listTemplates(tenantId);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get workflow template' })
  getTemplate(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.workflowsService.getTemplate(tenantId, id);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: 'Update workflow template' })
  updateTemplate(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() data: UpdateWorkflowTemplateDto,
  ) {
    return this.workflowsService.updateTemplate(tenantId, id, data);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete workflow template' })
  deleteTemplate(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.workflowsService.deleteTemplate(tenantId, id);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Create workflow request' })
  createRequest(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() data: CreateWorkflowRequestDto,
  ) {
    return this.workflowsService.createRequest(tenantId, {
      ...data,
      requestedBy: user.id,
    });
  }

  @Get('requests')
  @ApiOperation({ summary: 'List workflow requests' })
  @ApiQuery({ name: 'status', required: false })
  listRequests(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.workflowsService.listRequests(tenantId, status);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get workflow request' })
  getRequest(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.workflowsService.getRequest(tenantId, id);
  }

  @Post('requests/:id/approve')
  @ApiOperation({ summary: 'Approve workflow request' })
  approveRequest(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: DecisionDto,
  ) {
    return this.workflowsService.approveRequest(tenantId, id, user.id, data.notes, user.role);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'Reject workflow request' })
  rejectRequest(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: DecisionDto,
  ) {
    return this.workflowsService.rejectRequest(tenantId, id, user.id, data.notes, user.role);
  }

  @Post('requests/:id/cancel')
  @ApiOperation({ summary: 'Cancel workflow request' })
  cancelRequest(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.workflowsService.cancelRequest(tenantId, id, user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get workflow stats' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.workflowsService.getStats(tenantId);
  }
}
