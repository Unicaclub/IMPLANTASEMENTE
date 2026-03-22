import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { BacklogItemEntity } from '../../backlog/entities/backlog-item.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { AgentEntity } from '../../agents/entities/agent.entity';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'backlog_item_id', type: 'uuid', nullable: true })
  backlogItemId: string | null;

  @ManyToOne(() => BacklogItemEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'backlog_item_id' })
  backlogItem: BacklogItemEntity | null;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'task_type', type: 'varchar', length: 80 })
  taskType: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Column({ name: 'assigned_user_id', type: 'uuid', nullable: true })
  assignedUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser: UserEntity | null;

  @Column({ name: 'assigned_agent_id', type: 'uuid', nullable: true })
  assignedAgentId: string | null;

  @ManyToOne(() => AgentEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_agent_id' })
  assignedAgent: AgentEntity | null;

  @Column({ name: 'due_at', type: 'timestamptz', nullable: true })
  dueAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
