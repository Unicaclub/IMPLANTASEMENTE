import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrowserRunStatus } from '../../common/enums';
import { BrowserRunEntity } from './entities/browser-run.entity';
import { CreateBrowserRunDto, UpdateBrowserRunDto } from './dto';

@Injectable()
export class BrowserRunsService {
  constructor(
    @InjectRepository(BrowserRunEntity) private readonly repo: Repository<BrowserRunEntity>,
  ) {}

  async create(dto: CreateBrowserRunDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id }, relations: ['target'] });
    if (!e) throw new NotFoundException('Browser run nao encontrada');
    return e;
  }

  async findByProject(projectId: string) {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' }, relations: ['target'] });
  }

  async findByTarget(targetId: string) {
    return this.repo.find({ where: { targetId }, order: { createdAt: 'DESC' } });
  }

  async update(id: string, dto: UpdateBrowserRunDto) {
    const e = await this.findById(id);
    Object.assign(e, dto);
    if (dto.status === BrowserRunStatus.RUNNING && !e.startedAt) e.startedAt = new Date();
    if (dto.status === BrowserRunStatus.COMPLETED || dto.status === BrowserRunStatus.FAILED) e.finishedAt = new Date();
    return this.repo.save(e);
  }

  async incrementCounts(id: string, steps: number, evidences: number) {
    await this.repo.increment({ id }, 'stepsCount', steps);
    await this.repo.increment({ id }, 'evidencesCount', evidences);
  }
}
