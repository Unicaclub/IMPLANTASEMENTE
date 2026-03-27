import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from './entities/agent.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
  ) {}

  async create(dto: CreateAgentDto): Promise<AgentEntity> {
    const exists = await this.agentRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('Agent slug already exists');
    const agent = this.agentRepo.create(dto);
    return this.agentRepo.save(agent);
  }

  async findAll(): Promise<AgentEntity[]> {
    return this.agentRepo.find({ order: { executionOrder: 'ASC' }, take: 500 });
  }

  async findById(id: string): Promise<AgentEntity> {
    const a = await this.agentRepo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Agent not found');
    return a;
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentEntity> {
    const a = await this.findById(id);
    Object.assign(a, dto);
    return this.agentRepo.save(a);
  }
}
