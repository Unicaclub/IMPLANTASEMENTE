import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BacklogPriority, BacklogStatus, BacklogType, LogLevel, SeverityLevel } from '../../common/enums';
import { PaginatedResponseDto, PaginationQueryDto, getPaginationSkipTake } from '../../common/pipes/pagination';
import { ActivityHistoryService } from '../activity-history/activity-history.service';
import { ComparisonEntity } from '../comparisons/entities/comparison.entity';
import { DiffEntity } from '../comparisons/entities/diff.entity';
import { LogsService } from '../logs/logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectEntity } from '../projects/entities/project.entity';
import { ApproveBacklogItemDto, CreateBacklogItemDto, UpdateBacklogItemDto } from './dto';
import { BacklogItemEntity } from './entities/backlog-item.entity';

const SEVERITY_TO_PRIORITY: Record<string, BacklogPriority> = {
  [SeverityLevel.CRITICAL]: BacklogPriority.CRITICAL,
  [SeverityLevel.HIGH]: BacklogPriority.HIGH,
  [SeverityLevel.MEDIUM]: BacklogPriority.MEDIUM,
  [SeverityLevel.LOW]: BacklogPriority.LOW,
};

@Injectable()
export class BacklogService {
  private readonly logger = new Logger(BacklogService.name);

  constructor(
    @InjectRepository(BacklogItemEntity) private readonly repo: Repository<BacklogItemEntity>,
    @InjectRepository(ComparisonEntity) private readonly compRepo: Repository<ComparisonEntity>,
    @InjectRepository(DiffEntity) private readonly diffRepo: Repository<DiffEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly logsService: LogsService,
    private readonly dataSource: DataSource,
    private readonly activityHistory: ActivityHistoryService,
  ) {}

  async create(dto: CreateBacklogItemDto) { return this.repo.save(this.repo.create(dto)); }

  async findAllByProject(projectId: string, pagination?: PaginationQueryDto) {
    if (!pagination) {
      return this.repo.find({ where: { projectId }, order: { priority: 'ASC', createdAt: 'DESC' } });
    }

    const { skip, take } = getPaginationSkipTake(pagination);
    const [data, total] = await this.repo.findAndCount({
      where: { projectId },
      order: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC' },
      skip,
      take,
    });

    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Item de backlog não encontrado');
    return e;
  }

  async update(id: string, dto: UpdateBacklogItemDto) {
    const e = await this.findById(id);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async remove(id: string): Promise<{ message: string }> {
    const e = await this.findById(id);
    await this.repo.remove(e);
    return { message: 'Item de backlog removido' };
  }

  async summary(projectId: string) {
    const byStatus = await this.repo.createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .where('b.project_id = :projectId', { projectId })
      .groupBy('b.status')
      .getRawMany<{ status: string; count: number }>();

    const byPriority = await this.repo.createQueryBuilder('b')
      .select('b.priority', 'priority')
      .addSelect('COUNT(*)::int', 'count')
      .where('b.project_id = :projectId', { projectId })
      .groupBy('b.priority')
      .getRawMany<{ priority: string; count: number }>();

    const byType = await this.repo.createQueryBuilder('b')
      .select('b.backlog_type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .where('b.project_id = :projectId', { projectId })
      .groupBy('b.backlog_type')
      .getRawMany<{ type: string; count: number }>();

    const total = byStatus.reduce((acc, s) => acc + s.count, 0);

    return {
      total,
      by_status: Object.fromEntries(byStatus.map(s => [s.status, s.count])),
      by_priority: Object.fromEntries(byPriority.map(p => [p.priority, p.count])),
      by_type: Object.fromEntries(byType.map(t => [t.type, t.count])),
    };
  }

  async generateFromRun(runId: string, projectId?: string) {
    // Idempotency: check if items already exist for this run
    const existing = await this.repo.find({ where: { runId, sourceType: 'diff' } });
    if (existing.length > 0) {
      return { created: 0, skipped: existing.length, items: existing };
    }

    // Fetch comparisons for this run
    const comparisons = await this.compRepo.find({ where: { runId } });
    if (comparisons.length === 0) {
      return { created: 0, skipped: 0, items: [] };
    }

    // Resolve projectId from first comparison if not provided
    const resolvedProjectId = projectId || comparisons[0].projectId;

    // Fetch all diffs for these comparisons
    const compIds = comparisons.map(c => c.id);
    const diffs = compIds.length > 0
      ? await this.diffRepo.createQueryBuilder('d')
          .where('d.comparison_id IN (:...compIds)', { compIds })
          .getMany()
      : [];

    if (diffs.length === 0) {
      return { created: 0, skipped: 0, items: [] };
    }

    // Create backlog items from diffs
    const items: BacklogItemEntity[] = [];
    for (const diff of diffs) {
      const item = this.repo.create({
        projectId: resolvedProjectId,
        runId,
        sourceType: 'diff',
        sourceRef: diff.id,
        title: diff.title,
        description: diff.description || `Divergência: ${diff.title}`,
        backlogType: BacklogType.GAP,
        priority: SEVERITY_TO_PRIORITY[diff.severity] || BacklogPriority.MEDIUM,
        status: BacklogStatus.OPEN,
        evidenceCount: 0,
      });
      items.push(await this.repo.save(item));
    }

    // Log
    await this.logsService.logRun(runId, LogLevel.INFO, `Backlog gerado: ${items.length} itens`);

    // Notify workspace admin
    this.notifyProject(resolvedProjectId, 'backlog_generated', `Backlog gerado`, `${items.length} itens criados automaticamente da run`);

    return { created: items.length, skipped: 0, items };
  }

  async approveForTask(id: string, dto: ApproveBacklogItemDto, userId: string) {
    const item = await this.findById(id);

    if (!item.description || item.description.trim().length < 10) {
      throw new BadRequestException('Item de backlog precisa de descrição adequada antes da aprovação');
    }

    item.approvedForTask = dto.approvedForTask;
    item.approvedByUserId = userId;
    item.approvedAt = dto.approvedForTask ? new Date() : null;

    if (dto.approvedForTask && item.status === BacklogStatus.OPEN) {
      item.status = BacklogStatus.TRIAGED;
    }

    const saved = await this.repo.save(item);

    if (dto.approvedForTask) {
      this.notifyProject(item.projectId, 'backlog_approved', `Backlog aprovado: ${item.title}`, userId);

      this.activityHistory.createFromContext({
        projectId: item.projectId,
        userId,
        actionType: 'approved',
        entityType: 'backlog_item',
        entityId: item.id,
        description: `Backlog item approved: ${item.title}`,
      }).catch((err) => {
        this.logger.warn(`Failed to log activity: ${err.message}`);
      });
    }

    return saved;
  }

  private notifyProject(projectId: string, type: string, message: string, userId?: string) {
    this.dataSource.getRepository(ProjectEntity).findOne({
      where: { id: projectId },
      select: ['workspaceId'],
    }).then((project) => {
      if (project?.workspaceId) {
        this.notificationsService.notify(project.workspaceId, type, message, message, userId);
      }
    }).catch((err: Error) => {
      this.logger.warn(`Failed to send notification: ${err.message}`);
    });
  }
}
