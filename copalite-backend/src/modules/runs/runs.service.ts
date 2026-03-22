import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RunEntity } from './entities/run.entity';
import { RunStepEntity } from './entities/run-step.entity';
import { CreateRunDto, UpdateRunStatusDto, CreateRunStepDto } from './dto';
import { RunStatus } from '../../common/enums';
import { PaginationQueryDto, PaginatedResponseDto, getPaginationSkipTake } from '../../common/pipes/pagination';

@Injectable()
export class RunsService {
  constructor(
    @InjectRepository(RunEntity)
    private readonly runRepo: Repository<RunEntity>,
    @InjectRepository(RunStepEntity)
    private readonly stepRepo: Repository<RunStepEntity>,
  ) {}

  async create(dto: CreateRunDto, userId?: string): Promise<RunEntity> {
    const run = this.runRepo.create({
      ...dto,
      createdByUserId: userId || null,
      status: RunStatus.PENDING,
    });
    return this.runRepo.save(run);
  }

  async findAllByProject(projectId: string, pagination?: PaginationQueryDto): Promise<RunEntity[] | PaginatedResponseDto<RunEntity>> {
    if (!pagination) {
      return this.runRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
    }

    const { skip, take } = getPaginationSkipTake(pagination);
    const [data, total] = await this.runRepo.findAndCount({
      where: { projectId },
      order: { [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'DESC' },
      skip,
      take,
    });

    return new PaginatedResponseDto(data, total, pagination.page || 1, pagination.limit || 20);
  }

  async findById(id: string): Promise<RunEntity> {
    const run = await this.runRepo.findOne({ where: { id } });
    if (!run) throw new NotFoundException('Run not found');
    return run;
  }

  async updateStatus(id: string, dto: UpdateRunStatusDto): Promise<RunEntity> {
    const run = await this.findById(id);
    run.status = dto.status;

    if (dto.status === RunStatus.RUNNING && !run.startedAt) {
      run.startedAt = new Date();
    }
    if ([RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED].includes(dto.status)) {
      run.finishedAt = new Date();
    }

    return this.runRepo.save(run);
  }

  async createStep(runId: string, dto: CreateRunStepDto): Promise<RunStepEntity> {
    await this.findById(runId);
    const step = this.stepRepo.create({ ...dto, runId });
    return this.stepRepo.save(step);
  }

  async listSteps(runId: string): Promise<RunStepEntity[]> {
    return this.stepRepo.find({ where: { runId }, order: { stepOrder: 'ASC' } });
  }
}
