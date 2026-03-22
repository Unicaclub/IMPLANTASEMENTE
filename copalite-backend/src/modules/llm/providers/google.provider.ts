import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmConfig, LlmMessage, LlmResponse } from '../interfaces';

@Injectable()
export class GoogleProvider implements LlmProvider {
  readonly providerName = 'google';
  private readonly logger = new Logger(GoogleProvider.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_AI_API_KEY');
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async chat(messages: LlmMessage[], cfg: LlmConfig): Promise<LlmResponse> {
    if (!this.apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsgs = messages.filter(m => m.role !== 'system');

    // Map to Gemini format
    const contents = userMsgs.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const start = Date.now();
    const timeout = (cfg.timeout || 120) * 1000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${this.apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
          generationConfig: {
            temperature: cfg.temperature ?? 0.3,
            maxOutputTokens: cfg.maxTokens || 4096,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Google AI API error ${res.status}: ${body}`);
      }

      const data = await res.json();
      const durationMs = Date.now() - start;

      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text || '';
      const usage = data.usageMetadata || {};

      return {
        content: text,
        model: cfg.model,
        provider: this.providerName,
        tokenUsage: {
          input: usage.promptTokenCount || 0,
          output: usage.candidatesTokenCount || 0,
          total: usage.totalTokenCount || 0,
        },
        finishReason: candidate?.finishReason || 'unknown',
        durationMs,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
