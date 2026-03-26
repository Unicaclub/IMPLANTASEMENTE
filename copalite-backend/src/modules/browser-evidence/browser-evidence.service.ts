import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BrowserRunEntity } from '../browser-runs/entities/browser-run.entity';
import { CreateBrowserEvidenceDto } from './dto';
import { BrowserEvidenceEntity } from './entities/browser-evidence.entity';

@Injectable()
export class BrowserEvidenceService {
  constructor(
    @InjectRepository(BrowserEvidenceEntity)
    private readonly repo: Repository<BrowserEvidenceEntity>,
    @InjectRepository(BrowserRunEntity) private readonly runRepo: Repository<BrowserRunEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBrowserEvidenceDto) {
    return this.dataSource.transaction(async (manager) => {
      const evidence = await manager.save(
        BrowserEvidenceEntity,
        manager.create(BrowserEvidenceEntity, dto),
      );
      await manager.increment(BrowserRunEntity, { id: dto.browserRunId }, 'evidencesCount', 1);
      return evidence;
    });
  }

  async createBatch(dtos: CreateBrowserEvidenceDto[]) {
    if (dtos.length === 0) return [];
    return this.dataSource.transaction(async (manager) => {
      const entities = dtos.map((dto) => manager.create(BrowserEvidenceEntity, dto));
      const saved = await manager.save(BrowserEvidenceEntity, entities);
      await manager.increment(
        BrowserRunEntity,
        { id: dtos[0].browserRunId },
        'evidencesCount',
        dtos.length,
      );
      return saved;
    });
  }

  async findByRun(browserRunId: string) {
    return this.repo.find({
      where: { browserRunId },
      order: { stepIndex: 'ASC', createdAt: 'ASC' },
    });
  }
}
