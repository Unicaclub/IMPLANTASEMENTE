import { Injectable, Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

@Injectable()
export class GitCloneService {
  private readonly logger = new Logger(GitCloneService.name);
  private readonly baseDir = join(tmpdir(), 'copalite-repos');

  constructor() {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Clone or pull a git repository. Returns the local path or null on failure.
   */
  clone(repositoryUrl: string, projectId: string, branch = 'main'): string | null {
    try {
      const destPath = join(this.baseDir, projectId);

      if (existsSync(join(destPath, '.git'))) {
        this.logger.log(`Repository already cloned, pulling latest: ${destPath}`);
        try {
          execSync('git pull --ff-only', {
            cwd: destPath,
            timeout: 30_000,
            stdio: 'pipe',
          });
        } catch {
          this.logger.warn('git pull failed, using existing clone');
        }
        return destPath;
      }

      if (existsSync(destPath)) {
        rmSync(destPath, { recursive: true, force: true });
      }

      this.logger.log(`Cloning repository: ${repositoryUrl} → ${destPath}`);
      execSync(
        `git clone --depth 1 --branch "${branch}" "${repositoryUrl}" "${destPath}"`,
        { timeout: 120_000, stdio: 'pipe' },
      );

      return destPath;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to clone repository ${repositoryUrl}: ${msg}`);
      return null;
    }
  }

  /**
   * Remove cloned repository for a project.
   */
  cleanup(projectId: string): void {
    try {
      const destPath = join(this.baseDir, projectId);
      if (existsSync(destPath)) {
        rmSync(destPath, { recursive: true, force: true });
        this.logger.log(`Cleaned up repository: ${destPath}`);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to cleanup repository for project ${projectId}: ${msg}`);
    }
  }
}
