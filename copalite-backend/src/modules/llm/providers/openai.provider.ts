import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmConfig, LlmMessage, LlmResponse } from '../interfaces';

@Injectable()
export class OpenaiProvider implements LlmProvider {
  readonly providerName = 'openai';
  private readonly logger = new Logger(OpenaiProvider.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY');
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async chat(messages: LlmMessage[], cfg: LlmConfig): Promise<LlmResponse> {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY not configured');

    const start = Date.now();
    const timeout = (cfg.timeout || 120) * 1000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: cfg.maxTokens || 4096,
          temperature: cfg.temperature ?? 0.3,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        const retryAfter = res.headers.get('retry-after');
        const retryHint = retryAfter ? ` (retry after ${retryAfter}s)` : '';
        throw new Error(`OpenAI API error ${res.status}${retryHint}: ${body}`);
      }

      const data = await res.json();
      const durationMs = Date.now() - start;

      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content || '',
        model: data.model,
        provider: this.providerName,
        tokenUsage: {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        },
        finishReason: choice?.finish_reason || 'unknown',
        durationMs,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
