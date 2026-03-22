import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentRunEntity } from './entities/agent-run.entity';
import { CreateAgentRunDto, UpdateAgentRunStatusDto } from './dto';
import { RunStatus } from '../../common/enums';

@Injectable()
export class AgentRunsService {
  constructor(
    @InjectRepository(AgentRunEntity)
    private readonly agentRunRepo: Repository<AgentRunEntity>,
  ) {}

  async create(dto: CreateAgentRunDto): Promise<AgentRunEntity> {
    const ar = this.agentRunRepo.create({ ...dto, status: RunStatus.PENDING });
    return this.agentRunRepo.save(ar);
  }

  async findAllByRun(runId: string): Promise<AgentRunEntity[]> {
    return this.agentRunRepo.find({ where: { runId }, relations: ['agent'], order: { createdAt: 'ASC' } });
  }

  async findById(id: string): Promise<AgentRunEntity> {
    const ar = await this.agentRunRepo.findOne({ where: { id }, relations: ['agent'] });
    if (!ar) throw new NotFoundException('Agent run not found');
    return ar;
  }

  async updateStatus(id: string, dto: UpdateAgentRunStatusDto): Promise<AgentRunEntity> {
    const ar = await this.findById(id);
    ar.status = dto.status;
    if (dto.outputSummary) ar.outputSummary = dto.outputSummary;
    if (dto.confidenceLevel) ar.confidenceLevel = dto.confidenceLevel;

    if (dto.status === RunStatus.RUNNING && !ar.startedAt) ar.startedAt = new Date();
    if ([RunStatus.COMPLETED, RunStatus.FAILED, RunStatus.CANCELLED].includes(dto.status)) {
      ar.finishedAt = new Date();
    }
    return this.agentRunRepo.save(ar);
  }
}
