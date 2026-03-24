import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { ProblemSeverity, ProblemType } from '../../common/enums';
import { BrowserProblemEntity } from './entities/browser-problem.entity';

export interface ProblemInput {
  type: ProblemType;
  severity: ProblemSeverity;
  route: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface DiffResult {
  runIdA: string;
  runIdB: string;
  newProblems: BrowserProblemEntity[];
  resolvedProblems: BrowserProblemEntity[];
  persistentProblems: BrowserProblemEntity[];
  summary: {
    totalA: number;
    totalB: number;
    new: number;
    resolved: number;
    persistent: number;
  };
}

@Injectable()
export class BrowserProblemsService {
  constructor(
    @InjectRepository(BrowserProblemEntity) private readonly repo: Repository<BrowserProblemEntity>,
  ) {}

  /** Generate stable fingerprint for deduplication and diffing */
  fingerprint(type: string, route: string, summary: string): string {
    const normalized = `${type}|${route}|${summary.substring(0, 100).toLowerCase().replace(/\s+/g, ' ').trim()}`;
    return createHash('sha256').update(normalized).digest('hex').substring(0, 64);
  }

  /** Persist problems from a browser run */
  async persistFromRun(browserRunId: string, problems: ProblemInput[]): Promise<BrowserProblemEntity[]> {
    if (problems.length === 0) return [];

    const entities = problems.map(p => this.repo.create({
      browserRunId,
      type: p.type,
      severity: p.severity,
      route: p.route,
      summary: p.summary.substring(0, 2000),
      fingerprint: this.fingerprint(p.type, p.route, p.summary),
      metadataJson: p.metadata || null,
    }));

    return this.repo.save(entities);
  }

  /** Get all problems for a run */
  async findByRun(browserRunId: string): Promise<BrowserProblemEntity[]> {
    return this.repo.find({
      where: { browserRunId },
      order: { severity: 'ASC', route: 'ASC' },
    });
  }

  /** Get problem summary for a run */
  async getSummary(browserRunId: string) {
    const problems = await this.findByRun(browserRunId);
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    for (const p of problems) {
      bySeverity[p.severity] = (bySeverity[p.severity] || 0) + 1;
      byType[p.type] = (byType[p.type] || 0) + 1;
    }
    return { total: problems.length, bySeverity, byType };
  }

  /**
   * Diff two runs: compare problems by fingerprint.
   * Returns new (in B not A), resolved (in A not B), persistent (in both).
   */
  async diffRuns(runIdA: string, runIdB: string): Promise<DiffResult> {
    const [problemsA, problemsB] = await Promise.all([
      this.findByRun(runIdA),
      this.findByRun(runIdB),
    ]);

    const fpA = new Set(problemsA.map(p => p.fingerprint));
    const fpB = new Set(problemsB.map(p => p.fingerprint));

    const newProblems = problemsB.filter(p => !fpA.has(p.fingerprint));
    const resolvedProblems = problemsA.filter(p => !fpB.has(p.fingerprint));
    const persistentProblems = problemsB.filter(p => fpA.has(p.fingerprint));

    return {
      runIdA,
      runIdB,
      newProblems,
      resolvedProblems,
      persistentProblems,
      summary: {
        totalA: problemsA.length,
        totalB: problemsB.length,
        new: newProblems.length,
        resolved: resolvedProblems.length,
        persistent: persistentProblems.length,
      },
    };
  }
}
