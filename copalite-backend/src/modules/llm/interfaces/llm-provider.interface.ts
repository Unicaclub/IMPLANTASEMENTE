/**
 * Configuration for an LLM call — resolved from agent.config + env defaults.
 */
export interface LlmConfig {
  provider: string;     // 'anthropic' | 'openai' | 'google' | 'ollama'
  model: string;
  temperature?: number; // default 0.3
  maxTokens?: number;   // default 4096
  timeout?: number;     // seconds, default 120
}

/**
 * The message format sent to any LLM provider.
 */
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Standardized response from any LLM provider.
 */
export interface LlmResponse {
  content: string;
  model: string;
  provider: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  finishReason: string;
  durationMs: number;
}

/**
 * Contract that every LLM provider must implement.
 */
export interface LlmProvider {
  readonly providerName: string;
  chat(messages: LlmMessage[], config: LlmConfig): Promise<LlmResponse>;
  isAvailable(): boolean;
}
