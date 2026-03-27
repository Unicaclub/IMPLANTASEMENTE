import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiRegistryEntity } from './entities/api-registry.entity';
import { CreateApiRegistryDto, UpdateApiRegistryDto } from './dto';

@Injectable()
export class ApiRegistryService {
  constructor(@InjectRepository(ApiRegistryEntity) private readonly repo: Repository<ApiRegistryEntity>) {}
  async create(dto: CreateApiRegistryDto) { return this.repo.save(this.repo.create(dto)); }
  async findAllByProject(projectId: string) { return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' }, take: 500 }); }
  async findById(id: string) { const e = await this.repo.findOne({ where: { id } }); if (!e) throw new NotFoundException('API registry entry not found'); return e; }
  async update(id: string, dto: UpdateApiRegistryDto) { const e = await this.findById(id); Object.assign(e, dto); return this.repo.save(e); }
}
