import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UiRegistryEntity } from './entities/ui-registry.entity';
import { UiActionEntity } from './entities/ui-action.entity';
import { CreateUiRegistryDto, UpdateUiRegistryDto, CreateUiActionDto } from './dto';

@Injectable()
export class UiRegistryService {
  constructor(
    @InjectRepository(UiRegistryEntity) private readonly uiRepo: Repository<UiRegistryEntity>,
    @InjectRepository(UiActionEntity) private readonly actionRepo: Repository<UiActionEntity>,
  ) {}
  async create(dto: CreateUiRegistryDto) { return this.uiRepo.save(this.uiRepo.create(dto)); }
  async findAllByProject(projectId: string) { return this.uiRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } }); }
  async findById(id: string) { const e = await this.uiRepo.findOne({ where: { id } }); if (!e) throw new NotFoundException('UI registry entry not found'); return e; }
  async update(id: string, dto: UpdateUiRegistryDto) { const e = await this.findById(id); Object.assign(e, dto); return this.uiRepo.save(e); }
  async createAction(uiRegistryId: string, dto: CreateUiActionDto) { await this.findById(uiRegistryId); return this.actionRepo.save(this.actionRepo.create({ ...dto, uiRegistryId })); }
  async listActions(uiRegistryId: string) { return this.actionRepo.find({ where: { uiRegistryId }, order: { actionName: 'ASC' } }); }
}
