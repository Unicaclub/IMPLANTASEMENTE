import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DecisionEntity } from './entities/decision.entity';
import { CreateDecisionDto, UpdateDecisionDto } from './dto';

@Injectable()
export class DecisionsService {
  constructor(
    @InjectRepository(DecisionEntity)
    private readonly decisionRepo: Repository<DecisionEntity>,
  ) {}

  async create(dto: CreateDecisionDto, userId?: string): Promise<DecisionEntity> {
    const decision = this.decisionRepo.create({ ...dto, decidedByUserId: userId || null });
    return this.decisionRepo.save(decision);
  }

  async findAllByProject(projectId: string): Promise<DecisionEntity[]> {
    return this.decisionRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<DecisionEntity> {
    const d = await this.decisionRepo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Decision not found');
    return d;
  }

  async update(id: string, dto: UpdateDecisionDto): Promise<DecisionEntity> {
    const d = await this.findById(id);
    Object.assign(d, dto);
    return this.decisionRepo.save(d);
  }
}
