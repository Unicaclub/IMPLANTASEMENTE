import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmConfig, LlmMessage, LlmResponse } from '../interfaces';

@Injectable()
export class AnthropicProvider implements LlmProvider {
  readonly providerName = 'anthropic';
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async chat(messages: LlmMessage[], cfg: LlmConfig): Promise<LlmResponse> {
    if (!this.apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsgs = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const start = Date.now();
    const timeout = (cfg.timeout || 120) * 1000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: cfg.model,
          max_tokens: cfg.maxTokens || 4096,
          temperature: cfg.temperature ?? 0.3,
          system: systemMsg,
          messages: userMsgs,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const durationMs = Date.now() - start;

      return {
        content: data.content?.[0]?.text || '',
        model: data.model,
        provider: this.providerName,
        tokenUsage: {
          input: data.usage?.input_tokens || 0,
          output: data.usage?.output_tokens || 0,
          total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        finishReason: data.stop_reason || 'unknown',
        durationMs,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
