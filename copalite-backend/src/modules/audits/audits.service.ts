import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ComparisonResultStatus, LogLevel, SeverityLevel } from '../../common/enums';
import { ComparisonEntity } from '../comparisons/entities/comparison.entity';
import { DiffEntity } from '../comparisons/entities/diff.entity';
import { LogsService } from '../logs/logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectEntity } from '../projects/entities/project.entity';
import { RunEntity } from '../runs/entities/run.entity';
import { AuditEntity } from './entities/audit.entity';
import { CreateAuditDto, UpdateAuditDto } from './dto';

@Injectable()
export class AuditsService {
  private readonly logger = new Logger(AuditsService.name);

  constructor(
    @InjectRepository(AuditEntity) private readonly repo: Repository<AuditEntity>,
    @InjectRepository(ComparisonEntity) private readonly compRepo: Repository<ComparisonEntity>,
    @InjectRepository(DiffEntity) private readonly diffRepo: Repository<DiffEntity>,
    @InjectRepository(RunEntity) private readonly runRepo: Repository<RunEntity>,
    private readonly logsService: LogsService,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateAuditDto) { return this.repo.save(this.repo.create(dto)); }

  async findAllByProject(projectId: string) {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Auditoria não encontrada');
    return e;
  }

  async update(id: string, dto: UpdateAuditDto) {
    const e = await this.findById(id);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async generateFromRun(runId: string, projectId?: string) {
    // Idempotency
    const existing = await this.repo.findOne({ where: { runId } });
    if (existing) return existing;

    // Fetch run for title
    const run = await this.runRepo.findOne({ where: { id: runId } });
    const runTitle = run?.title || runId;
    const resolvedProjectId = projectId || run?.projectId;

    if (!resolvedProjectId) {
      throw new NotFoundException('Não foi possível resolver o projectId da run');
    }

    // Fetch comparisons
    const comparisons = await this.compRepo.find({ where: { runId } });

    // Calculate result_status
    let resultStatus: string;
    const results = comparisons.map(c => c.resultStatus);

    if (results.includes(ComparisonResultStatus.DIVERGENCE) || results.includes(ComparisonResultStatus.MISSING)) {
      resultStatus = 'divergence';
    } else if (results.every(r => r === ComparisonResultStatus.MATCH)) {
      resultStatus = 'match';
    } else if (results.every(r => r === ComparisonResultStatus.PARTIAL_MATCH)) {
      resultStatus = 'partial_match';
    } else {
      resultStatus = 'inconclusive';
    }

    // Count diffs by severity
    const compIds = comparisons.map(c => c.id);
    let severityCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    if (compIds.length > 0) {
      const diffs = await this.diffRepo.createQueryBuilder('d')
        .where('d.comparison_id IN (:...compIds)', { compIds })
        .getMany();

      for (const d of diffs) {
        const key = d.severity.toLowerCase();
        if (key in severityCounts) severityCounts[key]++;
      }
    }

    const summary = `Run '${runTitle}': ${comparisons.length} comparações, ${severityCounts.critical} críticos, ${severityCounts.high} altos, ${severityCounts.medium} médios`;

    const audit = this.repo.create({
      projectId: resolvedProjectId,
      runId,
      title: `Auditoria: ${runTitle}`,
      auditType: 'automated',
      summary,
      resultStatus,
    });

    const saved = await this.repo.save(audit);

    // Log + notify
    await this.logsService.logRun(runId, LogLevel.INFO, `Auditoria gerada: ${resultStatus}`);

    this.notifyProject(resolvedProjectId, 'audit_generated', `Auditoria gerada: ${runTitle}`);

    return saved;
  }

  private notifyProject(projectId: string, type: string, message: string) {
    this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId },
      select: ['workspaceId'],
    }).then((project) => {
      if (project?.workspaceId) {
        this.notificationsService.notify(project.workspaceId, type, message, message);
      }
    }).catch((err: Error) => {
      this.logger.warn(`Failed to send audit notification: ${err.message}`);
    });
  }
}
