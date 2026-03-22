import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComparisonEntity } from './entities/comparison.entity';
import { DiffEntity } from './entities/diff.entity';
import { CreateComparisonDto, CreateDiffDto } from './dto';

@Injectable()
export class ComparisonsService {
  constructor(
    @InjectRepository(ComparisonEntity) private readonly compRepo: Repository<ComparisonEntity>,
    @InjectRepository(DiffEntity) private readonly diffRepo: Repository<DiffEntity>,
  ) {}
  async create(dto: CreateComparisonDto) { return this.compRepo.save(this.compRepo.create(dto)); }
  async findAllByProject(projectId: string) { return this.compRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } }); }
  async findById(id: string) { const e = await this.compRepo.findOne({ where: { id } }); if (!e) throw new NotFoundException('Comparison not found'); return e; }
  async createDiff(comparisonId: string, dto: CreateDiffDto) { await this.findById(comparisonId); return this.diffRepo.save(this.diffRepo.create({ ...dto, comparisonId })); }
  async listDiffs(comparisonId: string) { return this.diffRepo.find({ where: { comparisonId }, order: { createdAt: 'ASC' } }); }
}
