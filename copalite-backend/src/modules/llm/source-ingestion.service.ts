import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import { tmpdir } from 'os';

import { SourceType, StatusBase } from '../../common/enums';
import { SourceEntity } from '../sources/entities/source.entity';

/** Max total characters of source code context sent to LLM (~5k tokens, safe for Tier 1 OpenAI 30k TPM) */
const MAX_CONTEXT_CHARS = 20_000;
/** Max single file size in bytes to read */
const MAX_FILE_BYTES = 15_000;
/** Extensions to include when scanning repos */
const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.py', '.go', '.rs',
  '.java', '.kt', '.rb', '.php', '.vue', '.svelte', '.css',
  '.scss', '.html', '.sql', '.yaml', '.yml', '.toml', '.md',
  '.prisma', '.graphql', '.proto', '.sh', '.dockerfile',
]);
/** File names always included regardless of extension */
const ALWAYS_INCLUDE = new Set([
  'package.json', 'tsconfig.json', 'docker-compose.yml', 'docker-compose.yaml',
  'Dockerfile', '.env.example', 'Makefile', 'Cargo.toml', 'go.mod',
  'requirements.txt', 'pyproject.toml', 'Gemfile', 'composer.json',
]);
/** Directories to skip */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '__pycache__', '.venv', 'vendor', 'target',
  '.cache', '.turbo', '.vercel',
]);

@Injectable()
export class SourceIngestionService {
  private readonly logger = new Logger(SourceIngestionService.name);
  private readonly cloneDir = join(tmpdir(), 'copalite-sources');
  private readonly activeClones = new Map<string, string>();

  constructor(
    @InjectRepository(SourceEntity)
    private readonly sourceRepo: Repository<SourceEntity>,
  ) {
    if (!existsSync(this.cloneDir)) {
      mkdirSync(this.cloneDir, { recursive: true });
    }
  }

  /**
   * Returns formatted source context for the LLM including actual code content.
   * For git repositories, clones and reads key files.
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

        if (src.sourceType === SourceType.REPOSITORY) {
          const codeContext = await this.ingestRepository(projectId, src);
          if (codeContext) sections.push(codeContext);
        } else if (src.connectionConfigJson) {
          const keys = Object.keys(src.connectionConfigJson);
          if (keys.length) {
            sections.push(`Config keys: ${keys.join(', ')}\n`);
          }
        }
      }

      return sections.join('\n');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to load source context for project ${projectId}: ${msg}`);
      return '';
    }
  }

  /**
   * Clone a git repository (shallow) and extract a structured code context.
   */
  private async ingestRepository(projectId: string, source: SourceEntity): Promise<string> {
    const repoDir = join(this.cloneDir, `${projectId}-${source.id}`);

    try {
      // Clone if not already cached
      if (!existsSync(join(repoDir, '.git'))) {
        if (existsSync(repoDir)) rmSync(repoDir, { recursive: true, force: true });
        mkdirSync(repoDir, { recursive: true });

        this.logger.log(`Cloning ${source.location} → ${repoDir}`);
        execSync(
          `git clone --depth 1 --single-branch "${source.location}" "${repoDir}"`,
          { timeout: 60_000, stdio: 'pipe' },
        );
        this.logger.log(`Clone completed: ${source.location}`);
      }

      this.activeClones.set(projectId, repoDir);

      // Build directory tree
      const tree = this.buildTree(repoDir, repoDir);
      // Read key files
      const fileContents = this.readKeyFiles(repoDir);

      const parts: string[] = [];
      parts.push('#### Directory Structure');
      parts.push('```');
      parts.push(tree);
      parts.push('```\n');

      if (fileContents.length > 0) {
        parts.push('#### Key Files Content\n');
        let totalChars = 0;
        for (const { relativePath, content } of fileContents) {
          if (totalChars + content.length > MAX_CONTEXT_CHARS) break;
          const ext = extname(relativePath).slice(1) || 'text';
          parts.push(`**${relativePath}**`);
          parts.push(`\`\`\`${ext}`);
          parts.push(content);
          parts.push('```\n');
          totalChars += content.length;
        }
      }

      return parts.join('\n');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to ingest repository ${source.location}: ${msg}`);
      return `> ⚠ Could not clone repository: ${msg}\n`;
    }
  }

  /**
   * Build a tree string of the directory structure (max 3 levels deep).
   */
  private buildTree(baseDir: string, dir: string, depth = 0, maxDepth = 3): string {
    if (depth >= maxDepth) return '';
    const lines: string[] = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
        .filter((e) => !e.name.startsWith('.') || ALWAYS_INCLUDE.has(e.name))
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

      for (const entry of entries) {
        const indent = '  '.repeat(depth);
        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name)) continue;
          lines.push(`${indent}${entry.name}/`);
          lines.push(this.buildTree(baseDir, join(dir, entry.name), depth + 1, maxDepth));
        } else {
          lines.push(`${indent}${entry.name}`);
        }
      }
    } catch { /* permission errors, etc. */ }
    return lines.filter(Boolean).join('\n');
  }

  /**
   * Read key source files from the repo, prioritizing config files and entry points.
   */
  private readKeyFiles(repoDir: string): { relativePath: string; content: string }[] {
    const files: { relativePath: string; content: string; priority: number }[] = [];

    const walk = (dir: string) => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(fullPath);
          } else {
            const relPath = relative(repoDir, fullPath);
            const ext = extname(entry.name).toLowerCase();
            const isAlwaysInclude = ALWAYS_INCLUDE.has(entry.name);
            const isCodeFile = CODE_EXTENSIONS.has(ext);

            if (!isAlwaysInclude && !isCodeFile) continue;

            try {
              const stat = statSync(fullPath);
              if (stat.size > MAX_FILE_BYTES || stat.size === 0) continue;

              const content = readFileSync(fullPath, 'utf-8');
              // Priority: config files first, then by depth (shallow = higher priority)
              const depth = relPath.split(/[\\/]/).length;
              const priority = isAlwaysInclude ? 0 : depth;
              files.push({ relativePath: relPath, content, priority });
            } catch { /* binary/unreadable */ }
          }
        }
      } catch { /* permission errors */ }
    };

    walk(repoDir);

    // Sort by priority (config first, then shallow files first)
    files.sort((a, b) => a.priority - b.priority);
    return files;
  }

  /** Cleanup cloned repos for a project */
  cleanup(projectId: string): void {
    const dir = this.activeClones.get(projectId);
    if (dir && existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true });
        this.activeClones.delete(projectId);
        this.logger.log(`Cleaned up cloned repo for project ${projectId}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to cleanup clone for ${projectId}: ${msg}`);
      }
    }
  }
}
