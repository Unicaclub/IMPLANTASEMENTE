import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { encryptCredentials, decryptCredentials } from '../../common/utils/crypto';
import { TargetEntity } from './entities/target.entity';
import { CreateTargetDto, UpdateTargetDto } from './dto';

@Injectable()
export class TargetsService {
  private readonly logger = new Logger(TargetsService.name);

  constructor(
    @InjectRepository(TargetEntity) private readonly repo: Repository<TargetEntity>,
  ) {}

  async create(dto: CreateTargetDto) {
    const entity = this.repo.create(dto);
    if (dto.credentialsJson && typeof dto.credentialsJson === 'object') {
      try {
        const encrypted = encryptCredentials(dto.credentialsJson);
        entity.credentialsJson = { _enc: encrypted } as any;
      } catch (err) {
        this.logger.warn(`Failed to encrypt credentials, storing as-is: ${err}`);
      }
    }
    return this.repo.save(entity);
  }

  async findAllByProject(projectId: string) {
    return this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Target nao encontrado');
    return e;
  }

  async update(id: string, dto: UpdateTargetDto) {
    const e = await this.findById(id);
    Object.assign(e, dto);
    return this.repo.save(e);
  }
}
