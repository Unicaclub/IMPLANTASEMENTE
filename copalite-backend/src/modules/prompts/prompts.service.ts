import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptEntity } from './entities/prompt.entity';
import { CreatePromptDto, UpdatePromptDto } from './dto';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(PromptEntity)
    private readonly promptRepo: Repository<PromptEntity>,
  ) {}

  async create(dto: CreatePromptDto): Promise<PromptEntity> {
    if (!dto.version) {
      const last = await this.promptRepo.findOne({
        where: { agentId: dto.agentId, name: dto.name },
        order: { version: 'DESC' },
      });
      dto.version = (last?.version ?? 0) + 1;
    }
    const prompt = this.promptRepo.create(dto);
    return this.promptRepo.save(prompt);
  }

  async findAllByAgent(agentId: string): Promise<PromptEntity[]> {
    return this.promptRepo.find({ where: { agentId }, order: { name: 'ASC', version: 'DESC' }, take: 500 });
  }

  async findById(id: string): Promise<PromptEntity> {
    const p = await this.promptRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Prompt not found');
    return p;
  }

  async update(id: string, dto: UpdatePromptDto): Promise<PromptEntity> {
    const p = await this.findById(id);
    Object.assign(p, dto);
    return this.promptRepo.save(p);
  }
}
