import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AgentRunEntity } from '../agent-runs/entities/agent-run.entity';
import { AgentOutputEntity } from './entities/agent-output.entity';
import { CreateAgentOutputDto, UpdateAgentOutputValidationDto } from './dto';

@Injectable()
export class AgentOutputsService {
  constructor(
    @InjectRepository(AgentOutputEntity)
    private readonly outputRepo: Repository<AgentOutputEntity>,
    @InjectRepository(AgentRunEntity)
    private readonly agentRunRepo: Repository<AgentRunEntity>,
  ) {}

  async create(dto: CreateAgentOutputDto): Promise<AgentOutputEntity> {
    const output = this.outputRepo.create(dto);
    return this.outputRepo.save(output);
  }

  async findAllByAgentRun(agentRunId: string): Promise<AgentOutputEntity[]> {
    return this.outputRepo.find({ where: { agentRunId }, order: { createdAt: 'ASC' } });
  }

  async findAllByRun(runId: string): Promise<AgentOutputEntity[]> {
    const agentRuns = await this.agentRunRepo.find({ where: { runId }, select: ['id'] });
    if (agentRuns.length === 0) return [];
    return this.outputRepo.find({
      where: { agentRunId: In(agentRuns.map((ar) => ar.id)) },
      order: { createdAt: 'ASC' },
    });
  }

  async findById(id: string): Promise<AgentOutputEntity> {
    const o = await this.outputRepo.findOne({ where: { id } });
    if (!o) throw new NotFoundException('Agent output not found');
    return o;
  }

  async updateValidation(id: string, dto: UpdateAgentOutputValidationDto): Promise<AgentOutputEntity> {
    const o = await this.findById(id);
    o.validationStatus = dto.validationStatus;
    return this.outputRepo.save(o);
  }
}
