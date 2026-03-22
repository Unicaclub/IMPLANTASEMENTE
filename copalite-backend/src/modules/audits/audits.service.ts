import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEntity } from './entities/audit.entity';
import { CreateAuditDto, UpdateAuditDto } from './dto';

@Injectable()
export class AuditsService {
  constructor(@InjectRepository(AuditEntity) private readonly repo: Repository<AuditEntity>) {}
  async create(dto: CreateAuditDto) { return this.repo.save(this.repo.create(dto)); }
  async findAllByProject(projectId: string) { return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } }); }
  async findById(id: string) { const e = await this.repo.findOne({ where: { id } }); if (!e) throw new NotFoundException('Audit not found'); return e; }
  async update(id: string, dto: UpdateAuditDto) { const e = await this.findById(id); Object.assign(e, dto); return this.repo.save(e); }
}
