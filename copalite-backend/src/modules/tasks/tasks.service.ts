import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BacklogStatus } from '../../common/enums';
import { PaginatedResponseDto, PaginationQueryDto, getPaginationSkipTake } from '../../common/pipes/pagination';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CreateTaskFromBacklogDto, UpdateTaskDto } from './dto';
import { TaskEntity } from './entities/task.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(TaskEntity) private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(BacklogItemEntity) private readonly backlogRepo: Repository<BacklogItemEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createFromBacklog(dto: CreateTaskFromBacklogDto) {
    const backlogItem = await this.backlogRepo.findOne({ where: { id: dto.backlogItemId } });
    if (!backlogItem) throw new NotFoundException('Backlog item not found');
    if (!backlogItem.approvedForTask) {
      throw new BadRequestException('Backlog item must be approved before creating a task');
    }

    const task = this.taskRepo.create({
      projectId: backlogItem.projectId,
      backlogItemId: backlogItem.id,
      title: backlogItem.title,
      description: backlogItem.description,
      taskType: backlogItem.backlogType === 'bug' ? 'bugfix' : 'development',
      assignedUserId: dto.assignedUserId || null,
      assignedAgentId: dto.assignedAgentId || null,
      dueAt: dto.dueAt || null,
    });

    const saved = await this.taskRepo.save(task);

    backlogItem.status = BacklogStatus.PLANNED;
    await this.backlogRepo.save(backlogItem);

    this.notifyTaskCreated(saved);

    return saved;
  }

  async findAllByProject(projectId: string, pagination?: PaginationQueryDto) {
    if (!pagination) {
      return this.taskRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
    }

    const { skip, take } = getPaginationSkipTake(pagination);
    const [data, total] = await this.taskRepo.findAndCount({
      where: { projectId },
      order: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC' },
      skip,
      take,
    });

    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  async findById(id: string) {
    const t = await this.taskRepo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const t = await this.findById(id);
    Object.assign(t, dto);
    return this.taskRepo.save(t);
  }

  private notifyTaskCreated(task: TaskEntity): void {
    this.taskRepo.manager.getRepository(ProjectEntity).findOne({
      where: { id: task.projectId },
      select: ['workspaceId'],
    }).then((project) => {
      if (project?.workspaceId) {
        const title = `Task created: ${task.title}`;
        this.notificationsService.notify(project.workspaceId, 'task_created', title, title);
      }
    }).catch((err: Error) => {
      this.logger.warn(`Failed to send task notification: ${err.message}`);
    });
  }
}
