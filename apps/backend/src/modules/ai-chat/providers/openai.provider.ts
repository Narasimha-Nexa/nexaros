import { LLMProvider, LLMRequest, LLMResponse, LLMUsage } from './llm-provider.interface';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private apiKey: string | undefined;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private toOpenAIMessages(req: LLMRequest) {
    return [
      { role: 'system', content: req.systemPrompt },
      ...req.messages.map(m => ({ role: m.role, content: m.content })),
    ];
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    if (!this.apiKey) throw new Error('OpenAI provider not configured (OPENAI_API_KEY missing)');
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: this.toOpenAIMessages(req),
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 1500,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const usage: LLMUsage = {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0,
    };
    return { content: json.choices?.[0]?.message?.content || '', usage, finishReason: json.choices?.[0]?.finish_reason };
  }

  async stream(req: LLMRequest, onToken: (token: string) => void): Promise<LLMResponse> {
    if (!this.apiKey) throw new Error('OpenAI provider not configured (OPENAI_API_KEY missing)');
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        messages: this.toOpenAIMessages(req),
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 1500,
        stream: true,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI stream error ${res.status}`);
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
              promptTokens: json.usage.prompt_tokens ?? 0,
              completionTokens: json.usage.completion_tokens ?? 0,
              totalTokens: json.usage.total_tokens ?? 0,
            };
          }
        } catch { /* ignore partial */ }
      }
    }
    return { content, usage, finishReason: 'stop' };
  }
}
