import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { encryptCredentials } from '../../common/utils/crypto';
import { OwnershipService } from '../../common/utils/ownership.service';
import { CreateTargetDto, UpdateTargetDto } from './dto';
import { TargetEntity } from './entities/target.entity';

@Injectable()
export class TargetsService {
  private readonly logger = new Logger(TargetsService.name);

  constructor(
    @InjectRepository(TargetEntity) private readonly repo: Repository<TargetEntity>,
    private readonly ownership: OwnershipService,
  ) {}

  async create(dto: CreateTargetDto, userId?: string) {
    if (userId) {
      await this.ownership.assertProjectMembership(dto.projectId, userId);
    }
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

  async findAllByProject(projectId: string, userId?: string) {
    if (userId) {
      await this.ownership.assertProjectMembership(projectId, userId);
    }
    const targets = await this.repo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
    return targets.map((t) => this.maskCredentials(t));
  }

  async findById(id: string, userId?: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Target nao encontrado');
    if (userId) {
      await this.ownership.assertProjectMembership(e.projectId, userId);
    }
    return this.maskCredentials(e);
  }

  async update(id: string, dto: UpdateTargetDto, userId?: string) {
    const e = await this.findById(id, userId);
    if (
      dto.credentialsJson &&
      typeof dto.credentialsJson === 'object' &&
      !('_enc' in dto.credentialsJson)
    ) {
      try {
        const encrypted = encryptCredentials(dto.credentialsJson);
        dto.credentialsJson = { _enc: encrypted } as any;
      } catch (err) {
        this.logger.warn(`Failed to encrypt credentials on update, storing as-is: ${err}`);
      }
    }
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  /**
   * Strip or mask credentialsJson before returning to the client.
   * Keeps non-sensitive keys (e.g. username, host) but removes passwords and encrypted blobs.
   */
  private maskCredentials(target: TargetEntity): TargetEntity {
    if (!target.credentialsJson) return target;

    const creds = target.credentialsJson as Record<string, any>;

    // Already encrypted — just signal that credentials exist
    if (creds._enc) {
      target.credentialsJson = { _masked: true } as any;
      return target;
    }

    // Plain object — mask sensitive fields
    const masked: Record<string, any> = {};
    for (const [key, val] of Object.entries(creds)) {
      if (/password|secret|token|key/i.test(key) && typeof val === 'string') {
        masked[key] = '***';
      } else {
        masked[key] = val;
      }
    }
    target.credentialsJson = masked as any;
    return target;
  }
}
