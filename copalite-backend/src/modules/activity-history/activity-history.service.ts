import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CreateActivityDto } from './dto';
import { ActivityHistoryEntity } from './entities/activity-history.entity';

export interface CreateActivityFromContextDto {
  projectId?: string;
  workspaceId?: string;
  userId?: string;
  agentId?: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
}

@Injectable()
export class ActivityHistoryService {
  private readonly logger = new Logger(ActivityHistoryService.name);

  constructor(
    @InjectRepository(ActivityHistoryEntity) private readonly repo: Repository<ActivityHistoryEntity>,
    @InjectRepository(ProjectEntity) private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  async create(dto: CreateActivityDto) { return this.repo.save(this.repo.create(dto)); }

  /**
   * Creates an activity record, auto-resolving workspaceId from projectId when needed.
   */
  async createFromContext(dto: CreateActivityFromContextDto): Promise<ActivityHistoryEntity | null> {
    let workspaceId = dto.workspaceId;

    if (!workspaceId && dto.projectId) {
      const project = await this.projectRepo.findOne({
        where: { id: dto.projectId },
        select: ['workspaceId'],
      });
      workspaceId = project?.workspaceId;
    }

    if (!workspaceId) {
      this.logger.warn(`Cannot resolve workspaceId for activity ${dto.actionType}:${dto.entityType}:${dto.entityId}`);
      return null;
    }

    return this.repo.save(this.repo.create({
      workspaceId,
      projectId: dto.projectId ?? null,
      userId: dto.userId ?? null,
      agentId: dto.agentId ?? null,
      actionType: dto.actionType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      description: dto.description,
    }));
  }

  async findByWorkspace(workspaceId: string) { return this.repo.find({ where: { workspaceId }, order: { createdAt: 'DESC' }, take: 200 }); }
  async findByProject(projectId: string) { return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' }, take: 200 }); }
}
