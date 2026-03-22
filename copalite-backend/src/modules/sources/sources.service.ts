import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SourceEntity } from './entities/source.entity';
import { CreateSourceDto, UpdateSourceDto } from './dto';
import { PaginationQueryDto, PaginatedResponseDto, getPaginationSkipTake } from '../../common/pipes/pagination';

@Injectable()
export class SourcesService {
  constructor(
    @InjectRepository(SourceEntity)
    private readonly sourceRepo: Repository<SourceEntity>,
  ) {}

  async create(dto: CreateSourceDto): Promise<SourceEntity> {
    const source = this.sourceRepo.create(dto);
    return this.sourceRepo.save(source);
  }

  async findAllByProject(projectId: string, pagination?: PaginationQueryDto): Promise<SourceEntity[] | PaginatedResponseDto<SourceEntity>> {
    if (!pagination) {
      return this.sourceRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
    }

    const { skip, take } = getPaginationSkipTake(pagination);
    const [data, total] = await this.sourceRepo.findAndCount({
      where: { projectId },
      order: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC' },
      skip,
      take,
    });

    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  async findById(id: string): Promise<SourceEntity> {
    const source = await this.sourceRepo.findOne({ where: { id } });
    if (!source) throw new NotFoundException('Source not found');
    return source;
  }

  async update(id: string, dto: UpdateSourceDto): Promise<SourceEntity> {
    const source = await this.findById(id);
    Object.assign(source, dto);
    return this.sourceRepo.save(source);
  }
}
