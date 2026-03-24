import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionStatus } from '../../common/enums';
import { TargetSessionEntity } from './entities/target-session.entity';
import { CreateSessionDto, ValidateSessionDto, UpdateSessionDto } from './dto';

@Injectable()
export class TargetSessionsService {
  constructor(
    @InjectRepository(TargetSessionEntity) private readonly repo: Repository<TargetSessionEntity>,
  ) {}

  async create(dto: CreateSessionDto) {
    return this.repo.save(this.repo.create(dto));
  }

  /**
   * Validate/create a session for a target.
   * Sprint 1: creates session with status 'valid' (no real browser validation yet).
   * Sprint 2+: will actually open browser and validate login.
   */
  async validate(dto: ValidateSessionDto) {
    // Check if valid session already exists
    const existing = await this.repo.findOne({
      where: { targetId: dto.targetId, profileName: dto.profileName || 'default', status: SessionStatus.VALID },
    });
    if (existing) {
      existing.lastValidatedAt = new Date();
      return this.repo.save(existing);
    }

    // Create new session marked as valid (scaffold — no real browser validation)
    const session = this.repo.create({
      targetId: dto.targetId,
      profileName: dto.profileName || 'default',
      status: SessionStatus.VALID,
      lastValidatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });
    return this.repo.save(session);
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Session nao encontrada');
    return e;
  }

  async findByTarget(targetId: string) {
    return this.repo.find({ where: { targetId }, order: { createdAt: 'DESC' } });
  }

  async update(id: string, dto: UpdateSessionDto) {
    const e = await this.findById(id);
    Object.assign(e, dto);
    return this.repo.save(e);
  }
}
