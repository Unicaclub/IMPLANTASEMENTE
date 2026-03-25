import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrowserRunEntity } from '../browser-runs/entities/browser-run.entity';
import { BrowserEvidenceEntity } from './entities/browser-evidence.entity';
import { CreateBrowserEvidenceDto } from './dto';

@Injectable()
export class BrowserEvidenceService {
  constructor(
    @InjectRepository(BrowserEvidenceEntity) private readonly repo: Repository<BrowserEvidenceEntity>,
    @InjectRepository(BrowserRunEntity) private readonly runRepo: Repository<BrowserRunEntity>,
  ) {}

  async create(dto: CreateBrowserEvidenceDto) {
    const evidence = await this.repo.save(this.repo.create(dto));
    // Increment evidences_count on the run
    await this.runRepo.increment({ id: dto.browserRunId }, 'evidencesCount', 1);
    return evidence;
  }

  async createBatch(dtos: CreateBrowserEvidenceDto[]) {
    const entities = dtos.map(dto => this.repo.create(dto));
    const saved = await this.repo.save(entities);
    if (dtos.length > 0) {
      await this.runRepo.increment({ id: dtos[0].browserRunId }, 'evidencesCount', dtos.length);
    }
    return saved;
  }

  async findByRun(browserRunId: string) {
    return this.repo.find({ where: { browserRunId }, order: { stepIndex: 'ASC', createdAt: 'ASC' } });
  }
}
