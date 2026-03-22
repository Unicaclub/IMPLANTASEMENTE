import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BacklogStatus } from '../../common/enums';
import { PaginatedResponseDto, PaginationQueryDto, getPaginationSkipTake } from '../../common/pipes/pagination';
import { ActivityHistoryService } from '../activity-history/activity-history.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectEntity } from '../projects/entities/project.entity';
import { ApproveBacklogItemDto, CreateBacklogItemDto, UpdateBacklogItemDto } from './dto';
import { BacklogItemEntity } from './entities/backlog-item.entity';

@Injectable()
export class BacklogService {
  private readonly logger = new Logger(BacklogService.name);

  constructor(
    @InjectRepository(BacklogItemEntity) private readonly repo: Repository<BacklogItemEntity>,
    private readonly notificationsService: NotificationsService,
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
    if (!e) throw new NotFoundException('Backlog item not found');
    return e;
  }

  async update(id: string, dto: UpdateBacklogItemDto) {
    const e = await this.findById(id);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async approveForTask(id: string, dto: ApproveBacklogItemDto, userId: string) {
    const item = await this.findById(id);

    if (!item.description || item.description.trim().length < 10) {
      throw new BadRequestException('Backlog item needs a proper description before approval');
    }

    item.approvedForTask = dto.approvedForTask;
    item.approvedByUserId = userId;
    item.approvedAt = dto.approvedForTask ? new Date() : null;

    if (dto.approvedForTask && item.status === BacklogStatus.OPEN) {
      item.status = BacklogStatus.TRIAGED;
    }

    const saved = await this.repo.save(item);

    if (dto.approvedForTask) {
      this.notifyProject(item.projectId, 'backlog_approved', `Backlog approved: ${item.title}`, userId);

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
