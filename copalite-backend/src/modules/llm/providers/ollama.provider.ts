import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmConfig, LlmMessage, LlmResponse } from '../interfaces';

@Injectable()
export class OllamaProvider implements LlmProvider {
  readonly providerName = 'ollama';
  private readonly logger = new Logger(OllamaProvider.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('OLLAMA_BASE_URL') || 'http://localhost:11434';
  }

  isAvailable(): boolean {
    return !!this.config.get<string>('OLLAMA_BASE_URL');
  }

  async chat(messages: LlmMessage[], cfg: LlmConfig): Promise<LlmResponse> {
    const start = Date.now();
    const timeout = (cfg.timeout || 120) * 1000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: cfg.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false,
          options: {
            temperature: cfg.temperature ?? 0.3,
            num_predict: cfg.maxTokens || 4096,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Ollama API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const durationMs = Date.now() - start;

      return {
        content: data.message?.content || '',
        model: data.model || cfg.model,
        provider: this.providerName,
        tokenUsage: {
          input: data.prompt_eval_count || 0,
          output: data.eval_count || 0,
          total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        finishReason: data.done ? 'stop' : 'unknown',
        durationMs,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
