import { Injectable, Logger } from '@nestjs/common';
import { LLMProvider, LLMRequest, LLMResponse, ToolCallRequest } from './providers/llm-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private providers: LLMProvider[] = [];

  constructor() {
    this.providers = this.buildProviders();
  }

  private buildProviders(): LLMProvider[] {
    const list: LLMProvider[] = [];
    if (process.env.OPENAI_API_KEY || process.env.AI_PROVIDER === 'openai') {
      list.push(new OpenAIProvider());
    }
    if (process.env.OPENROUTER_API_KEY) {
      list.push(new OpenAICompatibleProvider({
        name: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      }));
    }
    if (process.env.GEMINI_API_KEY) {
      list.push(new OpenAICompatibleProvider({
        name: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      }));
    }
    if (process.env.CLAUDE_API_KEY) {
      list.push(new OpenAICompatibleProvider({
        name: 'claude', baseUrl: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1', apiKey: process.env.CLAUDE_API_KEY, model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest',
      }));
    }
    list.push(new OpenAICompatibleProvider({
      name: 'ollama', baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1', model: process.env.OLLAMA_MODEL || 'llama3', headerKey: 'X-None',
    }));
    return list;
  }

  getProviders() {
    const preferred = (process.env.AI_PROVIDER || '').toLowerCase();
    return this.providers.map(p => ({
      name: p.name,
      configured: p.isConfigured(),
      isDefault: p.name === (preferred || this.providers.find(x => x.isConfigured())?.name),
    }));
  }

  getActiveProvider(): LLMProvider {
    const preferred = (process.env.AI_PROVIDER || '').toLowerCase();
    const named = this.providers.find(p => p.name === preferred && p.isConfigured());
    if (named) return named;
    const firstConfigured = this.providers.find(p => p.isConfigured());
    if (!firstConfigured) throw new Error('No AI provider configured. Set OPENAI_API_KEY / GEMINI_API_KEY / OPENROUTER_API_KEY or run a local Ollama.');
    return firstConfigured;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    return this.getActiveProvider().complete(req);
  }

  async stream(req: LLMRequest, onToken: (token: string) => void): Promise<LLMResponse> {
    return this.getActiveProvider().stream(req, onToken);
  }
}
