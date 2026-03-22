import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BacklogType, BacklogPriority, BacklogStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { RunEntity } from '../../runs/entities/run.entity';
import { AgentEntity } from '../../agents/entities/agent.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('backlog_items')
export class BacklogItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'run_id', type: 'uuid', nullable: true })
  runId: string | null;

  @ManyToOne(() => RunEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'run_id' })
  run: RunEntity | null;

  @Column({ name: 'source_type', type: 'varchar', length: 80 })
  sourceType: string;

  @Column({ name: 'source_ref', type: 'text', nullable: true })
  sourceRef: string | null;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'backlog_type', type: 'enum', enum: BacklogType })
  backlogType: BacklogType;

  @Column({ type: 'enum', enum: BacklogPriority, default: BacklogPriority.MEDIUM })
  priority: BacklogPriority;

  @Column({ type: 'enum', enum: BacklogStatus, default: BacklogStatus.OPEN })
  status: BacklogStatus;

  @Column({ name: 'evidence_count', type: 'int', default: 0 })
  evidenceCount: number;

  @Column({ name: 'assigned_agent_id', type: 'uuid', nullable: true })
  assignedAgentId: string | null;

  @ManyToOne(() => AgentEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_agent_id' })
  assignedAgent: AgentEntity | null;

  @Column({ name: 'approved_for_task', type: 'boolean', default: false })
  approvedForTask: boolean;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedByUser: UserEntity | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
