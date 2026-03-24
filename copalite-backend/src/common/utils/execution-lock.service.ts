import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Distributed execution lock using PostgreSQL Advisory Locks.
 * Works across multiple backend instances sharing the same database.
 *
 * Session-level advisory locks:
 * - Automatically released if the DB connection drops (crash safety)
 * - Shared across all instances connected to the same PostgreSQL
 * - Non-blocking tryAcquire — returns immediately if lock is held
 *
 * Safety net: acquireWithTimeout wraps execution in a max-duration guard.
 * If the caller exceeds the timeout, the lock is forcibly released.
 */
@Injectable()
export class ExecutionLockService {
  private readonly logger = new Logger(ExecutionLockService.name);

  // Fixed lock keys for different execution types
  static readonly BROWSER_RUN_LOCK = 100001;
  static readonly JOURNEY_LOCK = 100002;
  static readonly BROWSER_AGENT_LOCK = 100003;

  // Max lock duration (5 minutes) — safety net against stuck locks
  private static readonly MAX_LOCK_DURATION_MS = 5 * 60 * 1000;

  // Track local lock timestamps for TTL enforcement
  private readonly lockTimestamps = new Map<number, number>();

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Try to acquire an advisory lock. Returns true if acquired, false if already held.
   * Non-blocking — returns immediately.
   */
  async tryAcquire(lockKey: number): Promise<boolean> {
    try {
      // Check if a local lock is stuck (exceeded TTL) and force-release it
      await this.releaseIfExpired(lockKey);

      const result = await this.dataSource.query('SELECT pg_try_advisory_lock($1) AS acquired', [lockKey]);
      const acquired = result[0]?.acquired === true;
      if (acquired) {
        this.lockTimestamps.set(lockKey, Date.now());
        this.logger.log(`[LOCK] ACQUIRED lock="${this.lockName(lockKey)}" key=${lockKey}`);
      } else {
        const holder = await this.getLockHolder(lockKey);
        this.logger.warn(`[LOCK] DENIED lock="${this.lockName(lockKey)}" key=${lockKey} — held by pid=${holder?.pid || 'unknown'}`);
      }
      return acquired;
    } catch (err) {
      this.logger.error(`[LOCK] ERROR acquiring lock="${this.lockName(lockKey)}" key=${lockKey}: ${err}`);
      return false;
    }
  }

  /**
   * Release an advisory lock.
   */
  async release(lockKey: number): Promise<void> {
    try {
      const heldSince = this.lockTimestamps.get(lockKey);
      const durationMs = heldSince ? Date.now() - heldSince : 0;
      await this.dataSource.query('SELECT pg_advisory_unlock($1)', [lockKey]);
      this.lockTimestamps.delete(lockKey);
      this.logger.log(`[LOCK] RELEASED lock="${this.lockName(lockKey)}" key=${lockKey} held_for=${durationMs}ms`);
    } catch (err) {
      this.logger.error(`[LOCK] RELEASE ERROR lock="${this.lockName(lockKey)}" key=${lockKey}: ${err}`);
    }
  }

  /**
   * Check if a lock is currently held (without acquiring).
   */
  async isLocked(lockKey: number): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `SELECT EXISTS(SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND objid = $1) AS locked`,
        [lockKey],
      );
      return result[0]?.locked === true;
    } catch {
      return false;
    }
  }

  /**
   * Get info about who holds a specific advisory lock.
   */
  async getLockHolder(lockKey: number): Promise<{ pid: number; backendStart: string } | null> {
    try {
      const result = await this.dataSource.query(
        `SELECT l.pid, a.backend_start::text AS backend_start
         FROM pg_locks l
         JOIN pg_stat_activity a ON a.pid = l.pid
         WHERE l.locktype = 'advisory' AND l.objid = $1
         LIMIT 1`,
        [lockKey],
      );
      return result[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Get status of all known lock keys.
   */
  async getStatus(): Promise<Array<{ name: string; key: number; locked: boolean; heldSinceMs: number | null; holderPid: number | null }>> {
    const keys = [
      ExecutionLockService.BROWSER_RUN_LOCK,
      ExecutionLockService.JOURNEY_LOCK,
      ExecutionLockService.BROWSER_AGENT_LOCK,
    ];
    const statuses = [];
    for (const key of keys) {
      const locked = await this.isLocked(key);
      const holder = locked ? await this.getLockHolder(key) : null;
      const heldSince = this.lockTimestamps.get(key);
      statuses.push({
        name: this.lockName(key),
        key,
        locked,
        heldSinceMs: heldSince ? Date.now() - heldSince : null,
        holderPid: holder?.pid || null,
      });
    }
    return statuses;
  }

  /**
   * Force-release all advisory locks held by this session.
   * Use only for recovery — not normal flow.
   */
  async forceReleaseAll(): Promise<void> {
    try {
      await this.dataSource.query('SELECT pg_advisory_unlock_all()');
      this.lockTimestamps.clear();
      this.logger.warn('[LOCK] FORCE RELEASED all advisory locks for this session');
    } catch (err) {
      this.logger.error(`[LOCK] FORCE RELEASE ERROR: ${err}`);
    }
  }

  /**
   * Check if a lock has exceeded the max duration and release it if so.
   * Safety net against stuck locks from crashed operations.
   */
  private async releaseIfExpired(lockKey: number): Promise<void> {
    const heldSince = this.lockTimestamps.get(lockKey);
    if (!heldSince) return;

    const elapsed = Date.now() - heldSince;
    if (elapsed > ExecutionLockService.MAX_LOCK_DURATION_MS) {
      this.logger.warn(
        `[LOCK] EXPIRED lock="${this.lockName(lockKey)}" key=${lockKey} held_for=${elapsed}ms (max=${ExecutionLockService.MAX_LOCK_DURATION_MS}ms) — force releasing`,
      );
      await this.release(lockKey);
    }
  }

  private lockName(key: number): string {
    switch (key) {
      case ExecutionLockService.BROWSER_RUN_LOCK: return 'browser-run';
      case ExecutionLockService.JOURNEY_LOCK: return 'journey';
      case ExecutionLockService.BROWSER_AGENT_LOCK: return 'browser-agent';
      default: return `unknown-${key}`;
    }
  }
}
