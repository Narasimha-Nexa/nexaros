import { LLMProvider, LLMRequest, LLMResponse, LLMUsage } from './llm-provider.interface';

interface CompatibleConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  headerKey?: string;
  path?: string;
}

// Single implementation that speaks the OpenAI chat-completions protocol.
// Reused for OpenRouter, Google Gemini (OpenAI-compatible endpoint),
// Anthropic Claude (via compatible proxy if configured), and local Ollama.
export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  private cfg: CompatibleConfig;

  constructor(cfg: CompatibleConfig) {
    this.name = cfg.name;
    this.cfg = cfg;
  }

  isConfigured(): boolean {
    // Ollama typically needs no key; others require one.
    if (this.cfg.name === 'ollama') return true;
    return !!this.cfg.apiKey;
  }

  private url() {
    return `${this.cfg.baseUrl.replace(/\/$/, '')}${this.cfg.path || '/chat/completions'}`;
  }

  private toMessages(req: LLMRequest) {
    return [
      { role: 'system', content: req.systemPrompt },
      ...req.messages.map(m => ({ role: m.role, content: m.content })),
    ];
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.cfg.apiKey) {
      h[this.cfg.headerKey || 'Authorization'] = `Bearer ${this.cfg.apiKey}`;
    }
    return h;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    if (!this.isConfigured()) throw new Error(`${this.name} provider not configured`);
    const res = await fetch(this.url(), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: this.cfg.model,
        messages: this.toMessages(req),
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 1500,
      }),
    });
    if (!res.ok) throw new Error(`${this.name} error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const usage: LLMUsage = {
      promptTokens: json.usage?.prompt_tokens ?? json.usage?.promptTokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? json.usage?.completionTokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? json.usage?.totalTokens ?? 0,
    };
    return { content: json.choices?.[0]?.message?.content || '', usage, finishReason: json.choices?.[0]?.finish_reason };
  }

  async stream(req: LLMRequest, onToken: (token: string) => void): Promise<LLMResponse> {
    if (!this.isConfigured()) throw new Error(`${this.name} provider not configured`);
    const res = await fetch(this.url(), {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: this.cfg.model,
        messages: this.toMessages(req),
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 1500,
        stream: true,
      }),
    });
    if (!res.ok) throw new Error(`${this.name} stream error ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) return this.complete(req);
    const decoder = new TextDecoder();
    let buffer = '';
    let content = '';
    let usage: LLMUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) { content += delta; onToken(delta); }
          if (json.usage) {
            usage = {
              promptTokens: json.usage.prompt_tokens ?? json.usage.promptTokens ?? 0,
              completionTokens: json.usage.completion_tokens ?? json.usage.completionTokens ?? 0,
              totalTokens: json.usage.total_tokens ?? json.usage.totalTokens ?? 0,
            };
          }
        } catch { /* partial */ }
      }
    }
    return { content, usage, finishReason: 'stop' };
  }
}
