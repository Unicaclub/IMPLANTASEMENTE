import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRegistryEntity } from './entities/module-registry.entity';
import { CreateModuleRegistryDto, UpdateModuleRegistryDto } from './dto';

@Injectable()
export class ModulesRegistryService {
  constructor(
    @InjectRepository(ModuleRegistryEntity)
    private readonly repo: Repository<ModuleRegistryEntity>,
  ) {}

  async create(dto: CreateModuleRegistryDto): Promise<ModuleRegistryEntity> {
    const exists = await this.repo.findOne({ where: { projectId: dto.projectId, slug: dto.slug } });
    if (exists) throw new ConflictException('Module slug already exists in this project');
    return this.repo.save(this.repo.create(dto));
  }

  async findAllByProject(projectId: string): Promise<ModuleRegistryEntity[]> {
    return this.repo.find({ where: { projectId }, order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<ModuleRegistryEntity> {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('Module registry entry not found');
    return m;
  }

  async update(id: string, dto: UpdateModuleRegistryDto): Promise<ModuleRegistryEntity> {
    const m = await this.findById(id);
    Object.assign(m, dto);
    return this.repo.save(m);
  }
}
