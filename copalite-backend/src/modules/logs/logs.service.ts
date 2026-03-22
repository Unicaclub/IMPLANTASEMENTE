import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogEntity } from './entities/log.entity';
import { CreateLogDto } from './dto';
import { PaginationQueryDto, PaginatedResponseDto, getPaginationSkipTake } from '../../common/pipes/pagination';

@Injectable()
export class LogsService {
  constructor(@InjectRepository(LogEntity) private readonly repo: Repository<LogEntity>) {}

  async create(dto: CreateLogDto) {
    return this.repo.save(this.repo.create(dto));
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
}
