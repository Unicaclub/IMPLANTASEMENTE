import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SourceEntity } from '../sources/entities/source.entity';
import { StatusBase } from '../../common/enums';

/**
 * Retrieves project source context (repos, databases, etc.)
 * and formats it as additional context for the LLM user message.
 */
@Injectable()
export class SourceIngestionService {
  private readonly logger = new Logger(SourceIngestionService.name);

  /**
   * Returns a formatted Markdown block describing all active sources for a project.
   * If no sources or an error occurs, returns an empty string (never throws).
   */
  async getContext(projectId: string): Promise<string> {
    try {
      const sources = await this.sourceRepo.find({
        where: { projectId, status: StatusBase.ACTIVE },
        order: { createdAt: 'ASC' },
      });

      if (!sources.length) return '';

      const lines = ['## Project Sources'];
      for (const src of sources) {
        lines.push(`- **${src.name}** (${src.sourceType}): \`${src.location}\``);
        if (src.connectionConfigJson) {
          const keys = Object.keys(src.connectionConfigJson);
          if (keys.length) {
            lines.push(`  Config keys: ${keys.join(', ')}`);
          }
        }
      }
      lines.push('');
      return lines.join('\n');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to load source context for project ${projectId}: ${msg}`);
      return '';
    }
  }

  constructor(
    @InjectRepository(SourceEntity)
    private readonly sourceRepo: Repository<SourceEntity>,
  ) {}
}
