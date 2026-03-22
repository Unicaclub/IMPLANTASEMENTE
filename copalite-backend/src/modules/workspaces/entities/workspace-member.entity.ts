import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { StatusBase, WorkspaceMemberRole } from '../../../common/enums';
import { UserEntity } from '../../users/entities/user.entity';
import { WorkspaceEntity } from './workspace.entity';

@Entity('workspace_members')
@Unique(['workspaceId', 'userId'])
export class WorkspaceMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => WorkspaceEntity, (w) => w.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'member_role', type: 'enum', enum: WorkspaceMemberRole })
  memberRole: WorkspaceMemberRole;

  @Column({ type: 'enum', enum: StatusBase, default: StatusBase.ACTIVE })
  status: StatusBase;

  @Column({ name: 'joined_at', type: 'timestamptz', default: () => 'now()' })
  joinedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
