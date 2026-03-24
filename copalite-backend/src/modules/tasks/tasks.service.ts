import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BacklogStatus, TaskStatus } from '../../common/enums';
import { PaginatedResponseDto, PaginationQueryDto, getPaginationSkipTake } from '../../common/pipes/pagination';
import { BacklogItemEntity } from '../backlog/entities/backlog-item.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CreateTaskDto, CreateTaskFromBacklogDto, UpdateTaskDto } from './dto';
import { TaskEntity } from './entities/task.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(TaskEntity) private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(BacklogItemEntity) private readonly backlogRepo: Repository<BacklogItemEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateTaskDto) {
    const task = this.taskRepo.create({
      projectId: dto.projectId,
      backlogItemId: dto.backlogItemId || null,
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType,
      assignedUserId: dto.assignedUserId || null,
      assignedAgentId: dto.assignedAgentId || null,
      dueAt: dto.dueAt || null,
    });
    const saved = await this.taskRepo.save(task);
    this.notifyTaskCreated(saved);
    return saved;
  }

  async createFromBacklog(dto: CreateTaskFromBacklogDto) {
    const backlogItem = await this.backlogRepo.findOne({ where: { id: dto.backlogItemId } });
    if (!backlogItem) throw new NotFoundException('Item de backlog não encontrado');
    if (!backlogItem.approvedForTask) {
      throw new BadRequestException('Item de backlog deve ser aprovado antes de criar task');
    }

    // Use transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = queryRunner.manager.create(TaskEntity, {
        projectId: backlogItem.projectId,
        backlogItemId: backlogItem.id,
        title: backlogItem.title,
        description: backlogItem.description,
        taskType: 'backlog_derived',
        assignedUserId: dto.assignedUserId || null,
        assignedAgentId: dto.assignedAgentId || null,
        dueAt: dto.dueAt || null,
      });

      const saved = await queryRunner.manager.save(task);

      backlogItem.status = BacklogStatus.PLANNED;
      await queryRunner.manager.save(backlogItem);

      await queryRunner.commitTransaction();
      this.notifyTaskCreated(saved);
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
    if (!t) throw new NotFoundException('Task não encontrada');
    return t;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const t = await this.findById(id);
    Object.assign(t, dto);

    const saved = await this.taskRepo.save(t);

    // Cascade: if task done and derived from backlog, mark backlog item done too
    if (dto.status === TaskStatus.DONE && saved.taskType === 'backlog_derived' && saved.backlogItemId) {
      try {
        await this.backlogRepo.update(saved.backlogItemId, { status: BacklogStatus.DONE });
      } catch (err) {
        this.logger.warn(`Failed to cascade backlog status: ${err}`);
      }
    }

    return saved;
  }

  async remove(id: string): Promise<{ message: string }> {
    const t = await this.findById(id);
    await this.taskRepo.remove(t);
    return { message: 'Task removida' };
  }

  private notifyTaskCreated(task: TaskEntity): void {
    this.taskRepo.manager.getRepository(ProjectEntity).findOne({
      where: { id: task.projectId },
      select: ['workspaceId'],
    }).then((project) => {
      if (project?.workspaceId) {
        const title = `Task criada: ${task.title}`;
        this.notificationsService.notify(project.workspaceId, 'task_created', title, title);
      }
    }).catch((err: Error) => {
      this.logger.warn(`Failed to send task notification: ${err.message}`);
    });
  }
}
