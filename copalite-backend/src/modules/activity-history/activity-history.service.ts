import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityHistoryEntity } from './entities/activity-history.entity';
import { CreateActivityDto } from './dto';
@Injectable()
export class ActivityHistoryService {
  constructor(@InjectRepository(ActivityHistoryEntity) private readonly repo: Repository<ActivityHistoryEntity>) {}
  async create(dto: CreateActivityDto) { return this.repo.save(this.repo.create(dto)); }
  async findByWorkspace(workspaceId: string) { return this.repo.find({ where: { workspaceId }, order: { createdAt: 'DESC' }, take: 200 }); }
  async findByProject(projectId: string) { return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' }, take: 200 }); }
}
