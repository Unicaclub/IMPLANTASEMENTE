import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmConfig, LlmMessage, LlmResponse } from './interfaces';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenaiProvider } from './providers/openai.provider';
import { GoogleProvider } from './providers/google.provider';
import { OllamaProvider } from './providers/ollama.provider';

@Injectable()
export class LlmProviderFactory {
  private readonly logger = new Logger(LlmProviderFactory.name);
  private readonly providers: Map<string, LlmProvider>;
  private readonly defaultProvider: string;
  private readonly defaultModel: string;

  constructor(
    private readonly config: ConfigService,
    private readonly anthropic: AnthropicProvider,
    private readonly openai: OpenaiProvider,
    private readonly google: GoogleProvider,
    private readonly ollama: OllamaProvider,
  ) {
    this.providers = new Map<string, LlmProvider>([
      ['anthropic', this.anthropic],
      ['openai', this.openai],
      ['google', this.google],
      ['ollama', this.ollama],
    ]);

    this.defaultProvider = this.config.get<string>('DEFAULT_LLM_PROVIDER') || 'anthropic';
    this.defaultModel = this.config.get<string>('DEFAULT_LLM_MODEL') || 'claude-sonnet-4-20250514';
  }

  /**
   * Resolve the LLM config from agent.config + env defaults.
   */
  resolveConfig(agentConfig: Record<string, unknown> | null): LlmConfig {
    return {
      provider: (agentConfig?.provider as string) || this.defaultProvider,
      model: (agentConfig?.model as string) || this.defaultModel,
      temperature: (agentConfig?.temperature as number) ?? 0.3,
      maxTokens: (agentConfig?.maxTokens as number) || 4096,
      timeout: (agentConfig?.timeout as number) || 120,
    };
  }

  /** Max retry attempts for rate-limit (429) and transient server errors (5xx) */
  private static readonly MAX_RETRIES = 4;
  /** Base delay in ms for exponential backoff */
  private static readonly BASE_DELAY_MS = 2_000;

  /**
   * Execute a chat call through the resolved provider, with automatic
   * retry + exponential backoff for 429 rate-limit and 5xx errors.
   */
  async chat(messages: LlmMessage[], agentConfig: Record<string, unknown> | null): Promise<LlmResponse> {
    const cfg = this.resolveConfig(agentConfig);
    const provider = this.providers.get(cfg.provider);

    if (!provider) {
      throw new Error(`Unknown LLM provider: ${cfg.provider}. Available: ${[...this.providers.keys()].join(', ')}`);
    }

    if (!provider.isAvailable()) {
      throw new Error(`LLM provider '${cfg.provider}' is not configured. Check API key environment variables.`);
    }

    this.logger.log(`LLM call → ${cfg.provider}/${cfg.model} (temp=${cfg.temperature}, maxTokens=${cfg.maxTokens})`);

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= LlmProviderFactory.MAX_RETRIES; attempt++) {
      try {
        return await provider.chat(messages, cfg);
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const msg = lastError.message;

        // Retry on 429 (rate limit) and 5xx (server errors)
        const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate limit');
        const isServerError = /\b(500|502|503|529)\b/.test(msg);
        const isRetryable = isRateLimit || isServerError;

        if (!isRetryable || attempt === LlmProviderFactory.MAX_RETRIES) {
          throw lastError;
        }

        // Extract retry-after hint from error message if present (e.g. "retry in 9.324s")
        const retryMatch = msg.match(/retry\s+(?:in\s+|after\s+)([\d.]+)s/i);
        const retryAfterMs = retryMatch
          ? Math.ceil(parseFloat(retryMatch[1]) * 1000)
          : LlmProviderFactory.BASE_DELAY_MS * Math.pow(2, attempt);

        // Add jitter (±20%) to prevent thundering herd
        const jitter = retryAfterMs * (0.8 + Math.random() * 0.4);
        const delayMs = Math.min(Math.round(jitter), 60_000); // cap at 60s

        this.logger.warn(
          `LLM call failed (attempt ${attempt + 1}/${LlmProviderFactory.MAX_RETRIES + 1}): ${msg.substring(0, 200)}. ` +
          `Retrying in ${delayMs}ms...`,
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError || new Error('LLM call failed after retries');
  }

  /**
   * List all available (configured) providers.
   */
  getAvailableProviders(): string[] {
    return [...this.providers.entries()]
      .filter(([, p]) => p.isAvailable())
      .map(([name]) => name);
  }
}
