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

  /**
   * Execute a chat call through the resolved provider.
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

    return provider.chat(messages, cfg);
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
