import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACTS_BASE = path.resolve(process.cwd(), 'artifacts');
const JOURNEYS_ARTIFACTS = path.join(ARTIFACTS_BASE, 'journeys');

/** All known artifact directories to scan */
const ARTIFACT_DIRS = [ARTIFACTS_BASE, JOURNEYS_ARTIFACTS];

export interface CleanupResult {
  directoriesRemoved: number;
  filesRemoved: number;
  bytesFreed: number;
  errors: string[];
}

@Injectable()
export class ArtifactCleanupService {
  private readonly logger = new Logger(ArtifactCleanupService.name);

  /**
   * Remove artifacts for specific run IDs (browser runs or journey runs).
   * Scans both artifacts/ and artifacts/journeys/ for matching directories.
   */
  removeByRunIds(runIds: string[]): CleanupResult {
    const result: CleanupResult = { directoriesRemoved: 0, filesRemoved: 0, bytesFreed: 0, errors: [] };
    if (runIds.length === 0) return result;

    this.logger.log(`[ARTIFACT] Starting cleanup for ${runIds.length} run IDs`);

    for (const id of runIds) {
      for (const base of ARTIFACT_DIRS) {
        const dir = path.join(base, id);
        if (fs.existsSync(dir)) {
          const freed = this.removeDir(dir, result);
          this.logger.log(`[ARTIFACT] REMOVED dir="${dir}" freed=${freed} bytes`);
        }
      }
    }

    this.logger.log(
      `[ARTIFACT] Cleanup complete: ${result.directoriesRemoved} dirs, ${result.filesRemoved} files, ${result.bytesFreed} bytes freed` +
      (result.errors.length > 0 ? `, ${result.errors.length} errors` : ''),
    );
    return result;
  }

  /**
   * Remove orphan artifacts — directories in artifacts/ that don't match any known run ID.
   * Safe: only removes UUID-shaped directory names from known paths.
   */
  removeOrphans(knownRunIds: Set<string>): CleanupResult {
    const result: CleanupResult = { directoriesRemoved: 0, filesRemoved: 0, bytesFreed: 0, errors: [] };
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    this.logger.log(`[ARTIFACT] Starting orphan scan (${knownRunIds.size} known IDs)`);

    for (const base of ARTIFACT_DIRS) {
      if (!fs.existsSync(base)) continue;
      const entries = fs.readdirSync(base, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name === 'journeys') continue; // skip the journeys subdirectory itself
        // Only remove UUID-shaped directories to avoid deleting non-artifact dirs
        if (!uuidPattern.test(entry.name)) continue;
        if (!knownRunIds.has(entry.name)) {
          const dir = path.join(base, entry.name);
          const freed = this.removeDir(dir, result);
          this.logger.log(`[ARTIFACT] ORPHAN REMOVED dir="${dir}" freed=${freed} bytes`);
        }
      }
    }

    if (result.directoriesRemoved > 0) {
      this.logger.log(`[ARTIFACT] Orphan cleanup: ${result.directoriesRemoved} dirs, ${result.filesRemoved} files, ${result.bytesFreed} bytes freed`);
    } else {
      this.logger.log('[ARTIFACT] Orphan cleanup: no orphans found');
    }

    return result;
  }

  /**
   * Remove artifacts older than maxAgeMs.
   * Uses directory mtime as the age reference.
   */
  removeOlderThan(maxAgeMs: number): CleanupResult {
    const result: CleanupResult = { directoriesRemoved: 0, filesRemoved: 0, bytesFreed: 0, errors: [] };
    const cutoff = Date.now() - maxAgeMs;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    this.logger.log(`[ARTIFACT] Retention cleanup: removing dirs older than ${Math.round(maxAgeMs / 3600000)}h`);

    for (const base of ARTIFACT_DIRS) {
      if (!fs.existsSync(base)) continue;
      const entries = fs.readdirSync(base, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'journeys') continue;
        if (!uuidPattern.test(entry.name)) continue;
        const dir = path.join(base, entry.name);
        try {
          const stat = fs.statSync(dir);
          if (stat.mtimeMs < cutoff) {
            const freed = this.removeDir(dir, result);
            this.logger.log(`[ARTIFACT] EXPIRED dir="${dir}" age=${Math.round((Date.now() - stat.mtimeMs) / 3600000)}h freed=${freed} bytes`);
          }
        } catch { /* skip if stat fails */ }
      }
    }

    this.logger.log(`[ARTIFACT] Retention cleanup: ${result.directoriesRemoved} dirs removed, ${result.bytesFreed} bytes freed`);
    return result;
  }

  /**
   * Get disk usage of all artifact directories.
   */
  getDiskUsage(): { totalBytes: number; totalFiles: number; totalDirs: number; journeyDirs: number; browserDirs: number } {
    let totalBytes = 0;
    let totalFiles = 0;
    let totalDirs = 0;
    let journeyDirs = 0;
    let browserDirs = 0;

    for (const base of ARTIFACT_DIRS) {
      if (!fs.existsSync(base)) continue;
      const entries = fs.readdirSync(base, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'journeys') continue;
        totalDirs++;
        if (base === JOURNEYS_ARTIFACTS) journeyDirs++;
        else browserDirs++;
        const dir = path.join(base, entry.name);
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            try {
              totalBytes += fs.statSync(path.join(dir, file)).size;
              totalFiles++;
            } catch { /* ignore */ }
          }
        } catch { /* ignore */ }
      }
    }

    return { totalBytes, totalFiles, totalDirs, journeyDirs, browserDirs };
  }

  /**
   * List all artifact directories with their age and size.
   */
  listArtifacts(): Array<{ id: string; type: 'browser' | 'journey'; sizeBytes: number; ageMs: number; files: number }> {
    const artifacts: Array<{ id: string; type: 'browser' | 'journey'; sizeBytes: number; ageMs: number; files: number }> = [];
    const now = Date.now();

    for (const base of ARTIFACT_DIRS) {
      if (!fs.existsSync(base)) continue;
      const type = base === JOURNEYS_ARTIFACTS ? 'journey' as const : 'browser' as const;
      const entries = fs.readdirSync(base, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === 'journeys') continue;
        const dir = path.join(base, entry.name);
        let sizeBytes = 0;
        let fileCount = 0;
        let ageMs = 0;
        try {
          const stat = fs.statSync(dir);
          ageMs = now - stat.mtimeMs;
          const files = fs.readdirSync(dir);
          for (const file of files) {
            try {
              sizeBytes += fs.statSync(path.join(dir, file)).size;
              fileCount++;
            } catch { /* ignore */ }
          }
        } catch { continue; }
        artifacts.push({ id: entry.name, type, sizeBytes, ageMs, files: fileCount });
      }
    }

    return artifacts.sort((a, b) => a.ageMs - b.ageMs);
  }

  private removeDir(dirPath: string, result: CleanupResult): number {
    let freed = 0;
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const stat = fs.statSync(filePath);
          freed += stat.size;
          fs.unlinkSync(filePath);
          result.filesRemoved++;
          this.logger.debug(`[ARTIFACT] FILE REMOVED path="${filePath}" size=${stat.size}`);
        } catch (err) {
          result.errors.push(`Failed to remove ${filePath}: ${err}`);
          this.logger.warn(`[ARTIFACT] FILE REMOVE FAILED path="${filePath}" error="${err}"`);
        }
      }
      fs.rmdirSync(dirPath);
      result.directoriesRemoved++;
      result.bytesFreed += freed;
    } catch (err) {
      result.errors.push(`Failed to remove dir ${dirPath}: ${err}`);
      this.logger.warn(`[ARTIFACT] DIR REMOVE FAILED path="${dirPath}" error="${err}"`);
    }
    return freed;
  }
}
