import { Controller, Get, Post, Delete, Query, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AiChatService } from '../ai-chat/ai-chat.service';
import { AiReportService } from '../ai-chat/ai-report.service';
import { AdminCopilotChatDto, AdminCopilotReportDto } from './dto/admin-ai-copilot.dto';

@ApiTags('Admin AI Copilot')
@Controller('admin/ai-copilot')
// EntitlementsGuard is intentionally omitted: it reads request.user.tenantId
// to check tenant subscription status, but admin requests carry identity on
// request.admin (set by AdminAuthGuard). Without tenantId the guard is a
// no-op, so it provides no real access control for platform-level admins.
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AdminAiCopilotController {
  constructor(private ai: AiChatService, private reports: AiReportService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List configured LLM providers' })
  getProviders() { return this.ai.getProviders(); }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get AI suggestion prompts' })
  getSuggestions() { return this.ai.getSuggestions(); }

  @Get('conversations')
  @ApiOperation({ summary: 'List copilot conversations' })
  list(@Request() req: any, @Query('tenantId') tenantId: string) {
    if (!tenantId) throw new Error('tenantId required');
    return this.ai.listConversations(tenantId, req.admin.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a single conversation' })
  getOne(@Request() req: any, @Query('tenantId') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new Error('tenantId required');
    return this.ai.getConversation(tenantId, req.admin.id, id);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  delete(@Request() req: any, @Query('tenantId') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new Error('tenantId required');
    return this.ai.deleteConversation(tenantId, req.admin.id, id);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send a message to the AI Business Copilot' })
  chat(@Request() req: any, @Query('tenantId') tenantId: string, @Body() body: AdminCopilotChatDto) {
    if (!tenantId) throw new Error('tenantId required');
    return this.ai.chat(tenantId, req.admin.id, body.conversationId, body.message);
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate an AI business report' })
  generateReport(@Request() req: any, @Query('tenantId') tenantId: string, @Body() body: AdminCopilotReportDto) {
    if (!tenantId) throw new Error('tenantId required');
    return this.reports.generate(tenantId, req.admin.id, body.type, { from: body.from, to: body.to });
  }

  @Get('reports')
  @ApiOperation({ summary: 'List generated reports' })
  listReports(@Request() req: any, @Query('tenantId') tenantId: string) {
    if (!tenantId) throw new Error('tenantId required');
    return this.reports.list(tenantId, req.admin.id);
  }
}
