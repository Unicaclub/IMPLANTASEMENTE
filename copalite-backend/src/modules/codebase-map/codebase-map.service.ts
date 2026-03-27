import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodebaseMapEntity } from './entities/codebase-map.entity';
import { CreateCodebaseArtifactDto, UpdateCodebaseArtifactDto } from './dto';

@Injectable()
export class CodebaseMapService {
  constructor(@InjectRepository(CodebaseMapEntity) private readonly repo: Repository<CodebaseMapEntity>) {}
  async create(dto: CreateCodebaseArtifactDto) { return this.repo.save(this.repo.create(dto)); }
  async findAllByProject(projectId: string) { return this.repo.find({ where: { projectId }, order: { artifactPath: 'ASC' }, take: 500 }); }
  async findById(id: string) { const e = await this.repo.findOne({ where: { id } }); if (!e) throw new NotFoundException('Codebase artifact not found'); return e; }
  async update(id: string, dto: UpdateCodebaseArtifactDto) { const e = await this.findById(id); Object.assign(e, dto); return this.repo.save(e); }
}
