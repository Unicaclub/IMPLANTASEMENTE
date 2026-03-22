import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceEntity } from './entities/workspace.entity';
import { WorkspaceMemberEntity } from './entities/workspace-member.entity';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  AddWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from './dto';
import { WorkspaceMemberRole, StatusBase } from '../../common/enums';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepo: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly memberRepo: Repository<WorkspaceMemberEntity>,
  ) {}

  async create(dto: CreateWorkspaceDto, ownerUserId: string): Promise<WorkspaceEntity> {
    const slugExists = await this.workspaceRepo.findOne({ where: { slug: dto.slug } });
    if (slugExists) {
      throw new ConflictException('Workspace slug already taken');
    }

    const workspace = this.workspaceRepo.create({
      ...dto,
      ownerUserId,
      status: StatusBase.ACTIVE,
    });
    const saved = await this.workspaceRepo.save(workspace);

    // Auto-add owner as member
    const membership = this.memberRepo.create({
      workspaceId: saved.id,
      userId: ownerUserId,
      memberRole: WorkspaceMemberRole.OWNER,
      status: StatusBase.ACTIVE,
    });
    await this.memberRepo.save(membership);

    return saved;
  }

  async findAllForUser(userId: string): Promise<WorkspaceEntity[]> {
    const memberships = await this.memberRepo.find({
      where: { userId, status: StatusBase.ACTIVE },
      relations: ['workspace'],
    });
    return memberships.map((m) => m.workspace);
  }

  async findById(id: string): Promise<WorkspaceEntity> {
    const workspace = await this.workspaceRepo.findOne({ where: { id } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<WorkspaceEntity> {
    const workspace = await this.findById(id);
    Object.assign(workspace, dto);
    return this.workspaceRepo.save(workspace);
  }

  async addMember(workspaceId: string, dto: AddWorkspaceMemberDto): Promise<WorkspaceMemberEntity> {
    const exists = await this.memberRepo.findOne({
      where: { workspaceId, userId: dto.userId },
    });
    if (exists) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const member = this.memberRepo.create({
      workspaceId,
      userId: dto.userId,
      memberRole: dto.memberRole,
      status: StatusBase.ACTIVE,
    });
    return this.memberRepo.save(member);
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMemberEntity[]> {
    return this.memberRepo.find({
      where: { workspaceId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    dto: UpdateWorkspaceMemberDto,
  ): Promise<WorkspaceMemberEntity> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, workspaceId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    member.memberRole = dto.memberRole;
    return this.memberRepo.save(member);
  }

  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    const member = await this.memberRepo.findOne({
      where: { id: memberId, workspaceId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    if (member.memberRole === WorkspaceMemberRole.OWNER) {
      throw new ConflictException('Cannot remove workspace owner');
    }
    await this.memberRepo.remove(member);
  }
}
