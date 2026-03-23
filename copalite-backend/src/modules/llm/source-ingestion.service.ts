import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SourceEntity } from '../sources/entities/source.entity';
import { StatusBase } from '../../common/enums';
import { GitCloneService } from './git-clone.service';
import { CodeReaderService, ProjectReadResult } from './code-reader.service';

const MAX_CONTEXT_CHARS = 100_000;

@Injectable()
export class SourceIngestionService {
  private readonly logger = new Logger(SourceIngestionService.name);

  constructor(
    @InjectRepository(SourceEntity)
    private readonly sourceRepo: Repository<SourceEntity>,
    private readonly gitClone: GitCloneService,
    private readonly codeReader: CodeReaderService,
  ) {}

  /**
   * Returns formatted context for all active sources of a project.
   * For repository sources, clones and reads the actual code.
   */
  async getContext(projectId: string): Promise<string> {
    try {
      const sources = await this.sourceRepo.find({
        where: { projectId, status: StatusBase.ACTIVE },
        order: { createdAt: 'ASC' },
      });

      if (!sources.length) return '';

      const sections: string[] = ['## Project Sources\n'];

      for (const src of sources) {
        sections.push(`### ${src.name} (${src.sourceType})`);
        sections.push(`Location: \`${src.location}\`\n`);

        if (src.sourceType === 'repository' && src.location?.startsWith('http')) {
          const codeContext = this.ingestRepository(src.location, projectId);
          if (codeContext) {
            sections.push(codeContext);
            continue;
          }
        }

        // Fallback: just list the source info
        if (src.connectionConfigJson) {
          const keys = Object.keys(src.connectionConfigJson);
          if (keys.length) {
            sections.push(`Config keys: ${keys.join(', ')}`);
          }
        }
      }

      const context = sections.join('\n');
      if (context.length > MAX_CONTEXT_CHARS) {
        return context.substring(0, MAX_CONTEXT_CHARS) + '\n\n... (context truncated)';
      }
      return context;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to load source context for project ${projectId}: ${msg}`);
      return '';
    }
  }

  /**
   * Clone a repository and read its structure + key files.
   */
  private ingestRepository(url: string, projectId: string): string | null {
    try {
      const repoPath = this.gitClone.clone(url, projectId);
      if (!repoPath) return null;

      const result = this.codeReader.readProject(repoPath);
      return this.formatCodeContext(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Repository ingestion failed for ${url}: ${msg}`);
      return null;
    }
  }

  /**
   * Format the code reader result into a context string for the LLM.
   */
  private formatCodeContext(result: ProjectReadResult): string {
    if (!result.tree && !result.files.length) return '';

    const sections: string[] = [];

    sections.push(`**Languages detected**: ${result.languages.join(', ') || 'unknown'}`);
    sections.push(`**Total files**: ${result.totalFiles}\n`);

    if (result.tree) {
      sections.push('#### Project Structure');
      sections.push('```');
      sections.push(result.tree);
      sections.push('```\n');
    }

    if (result.files.length) {
      sections.push('#### Key Files\n');
      for (const file of result.files) {
        const ext = file.path.split('.').pop() || '';
        sections.push(`##### ${file.path}`);
        sections.push(`\`\`\`${ext}`);
        sections.push(file.content);
        sections.push('```\n');
      }
    }

    return sections.join('\n');
  }

  /**
   * Cleanup cloned repos for a project (call after pipeline finishes).
   */
  cleanup(projectId: string): void {
    this.gitClone.cleanup(projectId);
  }
}
