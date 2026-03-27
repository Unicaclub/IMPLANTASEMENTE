import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteRegistryEntity } from './entities/route-registry.entity';
import { CreateRouteRegistryDto, UpdateRouteRegistryDto } from './dto';

@Injectable()
export class RouteRegistryService {
  constructor(@InjectRepository(RouteRegistryEntity) private readonly repo: Repository<RouteRegistryEntity>) {}

  async create(dto: CreateRouteRegistryDto) { return this.repo.save(this.repo.create(dto)); }
  async findAllByProject(projectId: string) { return this.repo.find({ where: { projectId }, order: { path: 'ASC' }, take: 500 }); }
  async findById(id: string) {
    const r = await this.repo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Route registry entry not found');
    return r;
  }
  async update(id: string, dto: UpdateRouteRegistryDto) {
    const r = await this.findById(id);
    Object.assign(r, dto);
    return this.repo.save(r);
  }
}
