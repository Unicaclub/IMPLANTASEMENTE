import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvidenceRegistryEntity } from './entities/evidence-registry.entity';
import { CreateEvidenceDto } from './dto';

@Injectable()
export class EvidenceRegistryService {
  constructor(@InjectRepository(EvidenceRegistryEntity) private readonly repo: Repository<EvidenceRegistryEntity>) {}
  async create(dto: CreateEvidenceDto) { return this.repo.save(this.repo.create(dto)); }
  async findAllByProject(projectId: string) { return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' }, take: 500 }); }
  async findAllByRun(runId: string) { return this.repo.find({ where: { runId }, order: { createdAt: 'DESC' }, take: 500 }); }
  async findAllByRelatedEntity(relatedEntityType: string, relatedEntityId: string) {
    return this.repo.find({ where: { relatedEntityType, relatedEntityId }, order: { createdAt: 'DESC' }, take: 500 });
  }
  async findById(id: string) { const e = await this.repo.findOne({ where: { id } }); if (!e) throw new NotFoundException('Evidence not found'); return e; }
}
