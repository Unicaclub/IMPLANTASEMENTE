import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto, PaginationQueryDto, getPaginationSkipTake } from '../../common/pipes/pagination';
import { ActivityHistoryService } from '../activity-history/activity-history.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { ProjectEntity } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    private readonly activityHistory: ActivityHistoryService,
  ) {}

  async create(dto: CreateProjectDto, userId?: string): Promise<ProjectEntity> {
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
  ): Promise<ProjectEntity[] | PaginatedResponseDto<ProjectEntity>> {
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

  async findById(id: string): Promise<ProjectEntity> {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<ProjectEntity> {
    const project = await this.findById(id);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }
}
