import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RunStatus } from '../../common/enums';
import { PaginatedResponseDto, PaginationQueryDto, getPaginationSkipTake } from '../../common/pipes/pagination';
import { ActivityHistoryService } from '../activity-history/activity-history.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CreateRunDto, CreateRunStepDto, UpdateRunStatusDto } from './dto';
import { RunStepEntity } from './entities/run-step.entity';
import { RunEntity } from './entities/run.entity';

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);

  constructor(
    @InjectRepository(RunEntity)
    private readonly runRepo: Repository<RunEntity>,
    @InjectRepository(RunStepEntity)
    private readonly stepRepo: Repository<RunStepEntity>,
    private readonly activityHistory: ActivityHistoryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateRunDto, userId?: string): Promise<RunEntity> {
    const run = this.runRepo.create({
      ...dto,
      createdByUserId: userId || null,
      status: RunStatus.PENDING,
    });
    return this.runRepo.save(run);
  }

  async findAllByProject(projectId: string, pagination?: PaginationQueryDto): Promise<RunEntity[] | PaginatedResponseDto<RunEntity>> {
    if (!pagination) {
      return this.runRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
    }

    const { skip, take } = getPaginationSkipTake(pagination);
    const [data, total] = await this.runRepo.findAndCount({
      where: { projectId },
      order: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC' },
      skip,
      take,
    });

    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  async findById(id: string): Promise<RunEntity> {
    const run = await this.runRepo.findOne({ where: { id } });
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }

  async updateStatus(id: string, dto: UpdateRunStatusDto, userId?: string): Promise<RunEntity> {
    const run = await this.findById(id);
    const previousStatus = run.status;
    run.status = dto.status;

    if (dto.status === RunStatus.RUNNING && !run.startedAt) {
      run.startedAt = new Date();
    }
    if ([RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED].includes(dto.status)) {
      run.finishedAt = new Date();
    }

    const saved = await this.runRepo.save(run);

    const actionType = dto.status === RunStatus.RUNNING ? 'started' : 'status_changed';
    const description = dto.status === RunStatus.RUNNING
      ? `Run started: ${run.title}`
      : `Run status changed from ${previousStatus} to ${dto.status}: ${run.title}`;

    this.logActivity(run.projectId, actionType, 'run', run.id, description, userId);

    this.notifyRunStatus(run, dto.status, userId);

    return saved;
  }

  private logActivity(
    projectId: string,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
    userId?: string,
  ): void {
    this.activityHistory.createFromContext({
      projectId,
      userId: userId ?? undefined,
      actionType,
      entityType,
      entityId,
      description,
    }).catch((err) => {
      this.logger.warn(`Failed to log activity: ${err.message}`);
    });
  }

  private static readonly NOTIFY_STATUSES = new Map<RunStatus, string>([
    [RunStatus.RUNNING, 'run_started'],
    [RunStatus.COMPLETED, 'run_completed'],
    [RunStatus.FAILED, 'run_failed'],
  ]);

  private notifyRunStatus(run: RunEntity, status: RunStatus, userId?: string): void {
    const type = RunsService.NOTIFY_STATUSES.get(status);
    if (!type) return;

    this.runRepo.manager.getRepository(ProjectEntity).findOne({
      where: { id: run.projectId },
      select: ['workspaceId'],
    }).then((project) => {
      if (project?.workspaceId) {
        const title = `Run ${status.toLowerCase()}: ${run.title}`;
        this.notificationsService.notify(project.workspaceId, type, title, title, userId);
      }
    }).catch((err: Error) => {
      this.logger.warn(`Failed to send run notification: ${err.message}`);
    });
  }

  async createStep(runId: string, dto: CreateRunStepDto): Promise<RunStepEntity> {
    await this.findById(runId);
    const step = this.stepRepo.create({ ...dto, runId });
    return this.stepRepo.save(step);
  }

  async listSteps(runId: string): Promise<RunStepEntity[]> {
    return this.stepRepo.find({ where: { runId }, order: { stepOrder: 'ASC' } });
  }
}
