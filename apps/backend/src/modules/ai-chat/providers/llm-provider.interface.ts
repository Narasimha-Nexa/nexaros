export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd?: number;
}

export interface LLMResponse {
  content: string;
  usage: LLMUsage;
  toolCalls?: ToolCallRequest[];
  finishReason?: string;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMProvider {
  readonly name: string;
  isConfigured(): boolean;
  complete(req: LLMRequest): Promise<LLMResponse>;
  stream(req: LLMRequest, onToken: (token: string) => void): Promise<LLMResponse>;
}
