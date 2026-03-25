import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEntity } from './entities/log.entity';
import { CreateLogDto } from './dto';
import { LogLevel } from '../../common/enums';
import { PaginationQueryDto, PaginatedResponseDto, getPaginationSkipTake } from '../../common/pipes/pagination';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(@InjectRepository(LogEntity) private readonly repo: Repository<LogEntity>) {}

  async create(dto: CreateLogDto) {
    return this.repo.save(this.repo.create(dto));
  }

  /** Silent log — never throws */
  async log(level: LogLevel, message: string, context?: Record<string, unknown>): Promise<void> {
    try {
      await this.repo.save(this.repo.create({ logLevel: level, message, contextJson: context ?? null }));
    } catch (err) {
      this.logger.warn(`Failed to save log: ${err}`);
    }
  }

  /** Silent log scoped to a run — never throws */
  async logRun(runId: string, level: LogLevel, message: string, context?: Record<string, unknown>): Promise<void> {
    try {
      await this.repo.save(this.repo.create({ runId, logLevel: level, message, contextJson: context ?? null }));
    } catch (err) {
      this.logger.warn(`Failed to save run log: ${err}`);
    }
  }

  /** Silent log scoped to an agent run — never throws */
  async logAgentRun(agentRunId: string, level: LogLevel, message: string, context?: Record<string, unknown>): Promise<void> {
    try {
      await this.repo.save(this.repo.create({ agentRunId, logLevel: level, message, contextJson: context ?? null }));
    } catch (err) {
      this.logger.warn(`Failed to save agent run log: ${err}`);
    }
  }

  async findByProject(projectId: string, pagination?: PaginationQueryDto) {
    if (!pagination) {
      return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' }, take: 200 });
    }

    const { skip, take } = getPaginationSkipTake(pagination);
    const [data, total] = await this.repo.findAndCount({
      where: { projectId },
      order: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC' },
      skip,
      take,
    });

    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  async findByRun(runId: string, pagination?: PaginationQueryDto) {
    if (!pagination) {
      return this.repo.find({ where: { runId }, order: { createdAt: 'DESC' }, take: 200 });
    }

    const { skip, take } = getPaginationSkipTake(pagination);
    const [data, total] = await this.repo.findAndCount({
      where: { runId },
      order: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC' },
      skip,
      take,
    });

    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  async findAll(filters: { logLevel?: LogLevel; runId?: string; projectId?: string; limit?: number }) {
    const qb = this.repo.createQueryBuilder('log');

    if (filters.logLevel) qb.andWhere('log.log_level = :logLevel', { logLevel: filters.logLevel });
    if (filters.runId) qb.andWhere('log.run_id = :runId', { runId: filters.runId });
    if (filters.projectId) qb.andWhere('log.project_id = :projectId', { projectId: filters.projectId });

    qb.orderBy('log.created_at', 'DESC');
    qb.take(Math.min(filters.limit || 50, 100));

    return qb.getMany();
  }
}
