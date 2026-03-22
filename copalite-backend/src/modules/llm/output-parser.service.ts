import { Injectable, Logger } from '@nestjs/common';

/**
 * Result of parsing LLM output — either success with data or failure with error.
 */
export interface ParseResult<T = Record<string, unknown>> {
  success: boolean;
  data: T | null;
  raw: string;
  error?: string;
}

@Injectable()
export class OutputParserService {
  private readonly logger = new Logger(OutputParserService.name);

  /**
   * Attempts to extract and parse JSON from an LLM response string.
   *
   * Handles:
   * - Pure JSON responses
   * - JSON wrapped in ```json ... ``` fenced blocks
   * - JSON wrapped in ``` ... ``` (no lang tag)
   * - JSON embedded within surrounding text
   *
   * Returns parsed object on success, null on failure (never throws).
   */
  parse<T = Record<string, unknown>>(raw: string): ParseResult<T> {
    if (!raw || typeof raw !== 'string') {
      return { success: false, data: null, raw: raw ?? '', error: 'Empty or non-string input' };
    }

    const trimmed = raw.trim();

    // Strategy 1: Try parsing the entire response as JSON
    const direct = this.tryParse<T>(trimmed);
    if (direct) {
      return { success: true, data: direct, raw };
    }

    // Strategy 2: Extract from fenced code block ```json ... ``` or ``` ... ```
    const fenced = this.extractFencedJson(trimmed);
    if (fenced) {
      const parsed = this.tryParse<T>(fenced);
      if (parsed) {
        return { success: true, data: parsed, raw };
      }
    }

    // Strategy 3: Find the first { ... } or [ ... ] block in the text
    const extracted = this.extractJsonBlock(trimmed);
    if (extracted) {
      const parsed = this.tryParse<T>(extracted);
      if (parsed) {
        return { success: true, data: parsed, raw };
      }
    }

    const errorMsg = `Failed to extract valid JSON from LLM response (length=${raw.length})`;
    this.logger.warn(errorMsg);
    return { success: false, data: null, raw, error: errorMsg };
  }

  /**
   * Attempt JSON.parse; return parsed object or null.
   */
  private tryParse<T>(text: string): T | null {
    try {
      const parsed = JSON.parse(text);
      if (parsed !== null && typeof parsed === 'object') {
        return parsed as T;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Extract content from ```json ... ``` or ``` ... ``` fenced blocks.
   */
  private extractFencedJson(text: string): string | null {
    // Match ```json ... ``` first, then plain ``` ... ```
    const fencedRegex = /```(?:json)?\s*\n?([\s\S]*?)```/;
    const match = fencedRegex.exec(text);
    if (match?.[1]) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Find the first balanced JSON object {...} or array [...] in text.
   * Uses bracket counting to find the matching closing bracket.
   */
  private extractJsonBlock(text: string): string | null {
    // Find first { or [
    const objStart = text.indexOf('{');
    const arrStart = text.indexOf('[');

    let start: number;
    let openChar: string;
    let closeChar: string;

    if (objStart === -1 && arrStart === -1) return null;

    if (objStart === -1) {
      start = arrStart;
      openChar = '[';
      closeChar = ']';
    } else if (arrStart === -1) {
      start = objStart;
      openChar = '{';
      closeChar = '}';
    } else {
      // Prefer whichever comes first
      if (objStart <= arrStart) {
        start = objStart;
        openChar = '{';
        closeChar = '}';
      } else {
        start = arrStart;
        openChar = '[';
        closeChar = ']';
      }
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\' && inString) {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (ch === openChar) depth++;
      if (ch === closeChar) depth--;

      if (depth === 0) {
        return text.substring(start, i + 1);
      }
    }

    return null;
  }
}
