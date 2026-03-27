import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusBase } from '../../common/enums';
import { PaginatedResponseDto, PaginationQueryDto, getPaginationSkipTake } from '../../common/pipes/pagination';
import { ActivityHistoryService } from '../activity-history/activity-history.service';
import { WorkspaceMemberEntity } from '../workspaces/entities/workspace-member.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { ProjectEntity } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly memberRepo: Repository<WorkspaceMemberEntity>,
    private readonly activityHistory: ActivityHistoryService,
  ) {}

  async create(dto: CreateProjectDto, userId?: string): Promise<ProjectEntity> {
    if (userId) {
      await this.assertWorkspaceMembership(dto.workspaceId, userId);
    }
    const slugExists = await this.projectRepo.findOne({
      where: { workspaceId: dto.workspaceId, slug: dto.slug },
    });
    if (slugExists) {
      throw new ConflictException('Project slug already exists in this workspace');
    }

    const project = this.projectRepo.create(dto);
    const saved = await this.projectRepo.save(project);

    this.activityHistory.createFromContext({
      workspaceId: dto.workspaceId,
      projectId: saved.id,
      userId,
      actionType: 'created',
      entityType: 'project',
      entityId: saved.id,
      description: `Project created: ${saved.slug}`,
    }).catch((err) => {
      this.logger.warn(`Failed to log activity: ${err.message}`);
    });

    return saved;
  }

  async findAllByWorkspace(
    workspaceId: string,
    pagination?: PaginationQueryDto,
    userId?: string,
  ): Promise<ProjectEntity[] | PaginatedResponseDto<ProjectEntity>> {
    if (userId) {
      await this.assertWorkspaceMembership(workspaceId, userId);
    }
    if (!pagination) {
      return this.projectRepo.find({
        where: { workspaceId },
        order: { createdAt: 'DESC' },
      });
    }

    const { skip, take } = getPaginationSkipTake(pagination);
    const [data, total] = await this.projectRepo.findAndCount({
      where: { workspaceId },
      order: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC' },
      skip,
      take,
    });

    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  async findById(id: string, userId?: string): Promise<ProjectEntity> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (userId) {
      await this.assertWorkspaceMembership(project.workspaceId, userId);
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId?: string): Promise<ProjectEntity> {
    const project = await this.findById(id, userId);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  private async assertWorkspaceMembership(workspaceId: string, userId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { workspaceId, userId, status: StatusBase.ACTIVE },
    });
    if (!member) {
      throw new ForbiddenException('Not a member of this workspace');
    }
  }
}
