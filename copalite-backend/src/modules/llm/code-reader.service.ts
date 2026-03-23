import { Injectable, Logger } from '@nestjs/common';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

export interface ProjectReadResult {
  tree: string;
  files: { path: string; content: string }[];
  totalFiles: number;
  languages: string[];
}

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', '.next', 'vendor', '__pycache__',
  '.cache', 'build', 'coverage', '.nuxt', '.output', 'target',
  '.idea', '.vscode', '.gradle', 'bin', 'obj',
]);

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript', '.tsx': 'TypeScript/React', '.js': 'JavaScript',
  '.jsx': 'JavaScript/React', '.py': 'Python', '.php': 'PHP',
  '.java': 'Java', '.go': 'Go', '.rs': 'Rust', '.rb': 'Ruby',
  '.cs': 'C#', '.cpp': 'C++', '.c': 'C', '.swift': 'Swift',
  '.kt': 'Kotlin', '.scala': 'Scala', '.vue': 'Vue',
  '.svelte': 'Svelte', '.dart': 'Dart', '.sql': 'SQL',
};

const KEY_FILES = [
  'package.json', 'composer.json', 'requirements.txt', 'Cargo.toml',
  'go.mod', 'Gemfile', 'pom.xml', 'build.gradle',
  'README.md', 'readme.md',
  'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  '.env.example', '.env.sample',
];

const KEY_PATTERNS = [
  /^src\/(main|app|index)\.\w+$/,
  /^src\/modules\/.*\.module\.\w+$/,
  /^(migrations|database)\/.*\.\w+$/,
  /^src\/(routes|controllers|api)\/.*\.\w+$/,
  /^src\/(pages|views|screens)\/.*\.\w+$/,
  /^src\/(entities|models)\/.*\.\w+$/,
];

const MAX_LINES_PER_FILE = 500;
const MAX_TOTAL_CHARS = 100_000;

@Injectable()
export class CodeReaderService {
  private readonly logger = new Logger(CodeReaderService.name);

  /**
   * Read project structure and key files from a local repository path.
   */
  readProject(repoPath: string): ProjectReadResult {
    try {
      const allFiles = this.listFiles(repoPath, repoPath);
      const tree = this.buildTree(allFiles);
      const languageSet = new Set<string>();

      for (const f of allFiles) {
        const ext = extname(f).toLowerCase();
        if (LANGUAGE_MAP[ext]) languageSet.add(LANGUAGE_MAP[ext]);
      }

      const filesToRead = this.selectKeyFiles(allFiles);
      const files: { path: string; content: string }[] = [];
      let totalChars = 0;

      for (const filePath of filesToRead) {
        if (totalChars >= MAX_TOTAL_CHARS) break;
        try {
          const fullPath = join(repoPath, filePath);
          const stat = statSync(fullPath);
          if (stat.size > 512_000) continue; // skip files > 500KB

          let content = readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          if (lines.length > MAX_LINES_PER_FILE) {
            content = lines.slice(0, MAX_LINES_PER_FILE).join('\n') + '\n... (truncated)';
          }

          if (totalChars + content.length > MAX_TOTAL_CHARS) {
            content = content.substring(0, MAX_TOTAL_CHARS - totalChars) + '\n... (truncated)';
          }

          files.push({ path: filePath, content });
          totalChars += content.length;
        } catch {
          // skip unreadable files
        }
      }

      return {
        tree,
        files,
        totalFiles: allFiles.length,
        languages: [...languageSet].sort(),
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to read project at ${repoPath}: ${msg}`);
      return { tree: '', files: [], totalFiles: 0, languages: [] };
    }
  }

  private listFiles(dir: string, rootDir: string): string[] {
    const results: string[] = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...this.listFiles(fullPath, rootDir));
        } else if (entry.isFile()) {
          results.push(relative(rootDir, fullPath).replace(/\\/g, '/'));
        }
      }
    } catch {
      // skip unreadable directories
    }
    return results;
  }

  private buildTree(files: string[]): string {
    const lines: string[] = [];
    const dirs = new Map<string, string[]>();

    for (const f of files) {
      const parts = f.split('/');
      const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
      if (!dirs.has(dir)) dirs.set(dir, []);
      dirs.get(dir)!.push(parts[parts.length - 1]);
    }

    const sortedDirs = [...dirs.keys()].sort();
    for (const dir of sortedDirs) {
      lines.push(`${dir}/`);
      const dirFiles = dirs.get(dir)!.sort();
      // Show max 20 files per directory to keep tree manageable
      const shown = dirFiles.slice(0, 20);
      for (const f of shown) {
        lines.push(`  ${f}`);
      }
      if (dirFiles.length > 20) {
        lines.push(`  ... and ${dirFiles.length - 20} more files`);
      }
    }

    return lines.join('\n');
  }

  private selectKeyFiles(allFiles: string[]): string[] {
    const selected = new Set<string>();

    // Add exact key files
    for (const f of allFiles) {
      const basename = f.split('/').pop() || '';
      if (KEY_FILES.includes(basename)) {
        selected.add(f);
      }
    }

    // Add pattern-matched files
    for (const f of allFiles) {
      for (const pattern of KEY_PATTERNS) {
        if (pattern.test(f)) {
          selected.add(f);
          break;
        }
      }
    }

    return [...selected].sort();
  }
}
