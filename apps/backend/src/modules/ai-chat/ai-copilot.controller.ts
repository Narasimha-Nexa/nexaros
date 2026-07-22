import {
  Controller, Get, Post, Delete, Patch, Query, Param, Body, Sse, UseGuards, Req, Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AiChatService } from './ai-chat.service';
import { AiReportService } from './ai-report.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('ai-copilot')
@ApiBearerAuth()
@Controller('ai-copilot')
@UseGuards(JwtAuthGuard)
export class AiCopilotController {
  constructor(private ai: AiChatService, private reports: AiReportService) {}

  private getUser(req: Request): { tenantId: string; id: string } {
    const u = (req as Request & { user: { tenantId: string; id: string } }).user;
    return { tenantId: u.tenantId, id: u.id };
  }

  @Get('providers')
  @ApiOperation({ summary: 'List available AI providers' })
  getProviders() {
    return this.ai.getProviders();
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested prompts' })
  getSuggestions() {
    return this.ai.getSuggestions();
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations' })
  listConversations(@Req() req: Request) {
    const { tenantId, id } = this.getUser(req);
    return this.ai.listConversations(tenantId, id);
  }

  @Get('conversations/search')
  @ApiOperation({ summary: 'Search conversations' })
  @ApiQuery({ name: 'q', required: true })
  searchConversations(@Req() req: Request, @Query('q') query: string) {
    const { tenantId, id } = this.getUser(req);
    return this.ai.searchConversations(tenantId, id, query);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  getConversation(@Req() req: Request, @Param('id') id: string) {
    const { tenantId, id: userId } = this.getUser(req);
    return this.ai.getConversation(tenantId, userId, id);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete conversation (soft)' })
  deleteConversation(@Req() req: Request, @Param('id') id: string) {
    const { tenantId, id: userId } = this.getUser(req);
    return this.ai.deleteConversation(tenantId, userId, id);
  }

  @Patch('conversations/:id/pin')
  @ApiOperation({ summary: 'Pin/unpin conversation' })
  pinConversation(@Req() req: Request, @Param('id') id: string, @Body() body: { pinned: boolean }) {
    const { tenantId, id: userId } = this.getUser(req);
    return this.ai.pinConversation(tenantId, userId, id, body.pinned);
  }

  @Patch('conversations/:id/rename')
  @ApiOperation({ summary: 'Rename conversation' })
  renameConversation(@Req() req: Request, @Param('id') id: string, @Body() body: { title: string }) {
    const { tenantId, id: userId } = this.getUser(req);
    return this.ai.renameConversation(tenantId, userId, id, body.title);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send a chat message' })
  chat(
    @Req() req: Request,
    @Body() body: { message: string; conversationId?: string },
  ) {
    const { tenantId, id: userId } = this.getUser(req);
    return this.ai.chat(tenantId, userId, body.conversationId, body.message);
  }

  @Sse('chat/stream')
  @ApiOperation({ summary: 'Stream chat response via SSE' })
  async streamChat(
    @Req() req: Request,
    @Query('message') message: string,
    @Query('conversationId') conversationId: string,
    @Res() res: Response,
  ) {
    const { tenantId, id: userId } = this.getUser(req);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const gen = this.ai.streamChat(tenantId, userId, conversationId || undefined, message || '');
    for await (const chunk of gen) {
      res.write(chunk);
    }
    res.end();
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate an AI report' })
  generateReport(
    @Req() req: Request,
    @Body() body: { type: string; from?: string; to?: string },
  ) {
    const { tenantId, id: userId } = this.getUser(req);
    return this.reports.generate(tenantId, userId, body.type, { from: body.from, to: body.to });
  }

  @Get('reports')
  @ApiOperation({ summary: 'List generated reports' })
  listReports(@Req() req: Request) {
    const { tenantId, id: userId } = this.getUser(req);
    return this.reports.list(tenantId, userId);
  }
}
