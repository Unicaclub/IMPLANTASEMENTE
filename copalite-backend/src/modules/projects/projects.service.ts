import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
  ) {}

  async create(dto: CreateProjectDto): Promise<ProjectEntity> {
    const slugExists = await this.projectRepo.findOne({
      where: { workspaceId: dto.workspaceId, slug: dto.slug },
    });
    if (slugExists) {
      throw new ConflictException('Project slug already exists in this workspace');
    }

    const project = this.projectRepo.create(dto);
    return this.projectRepo.save(project);
  }

  async findAllByWorkspace(workspaceId: string): Promise<ProjectEntity[]> {
    return this.projectRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
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
