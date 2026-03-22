import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportEntity } from './entities/report.entity';
import { CreateReportDto, UpdateReportDto } from './dto';
@Injectable()
export class ReportsService {
  constructor(@InjectRepository(ReportEntity) private readonly repo: Repository<ReportEntity>) {}
  async create(dto: CreateReportDto) { return this.repo.save(this.repo.create(dto)); }
  async findAllByProject(projectId: string) { return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } }); }
  async findById(id: string) { const e = await this.repo.findOne({ where: { id } }); if (!e) throw new NotFoundException('Report not found'); return e; }
  async update(id: string, dto: UpdateReportDto) { const e = await this.findById(id); Object.assign(e, dto); return this.repo.save(e); }
}
