import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RunType, RunStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { SourceEntity } from '../../sources/entities/source.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('runs')
export class RunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @ManyToOne(() => SourceEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_id' })
  source: SourceEntity | null;

  @Column({ name: 'run_type', type: 'enum', enum: RunType })
  runType: RunType;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ type: 'text' })
  goal: string;

  @Column({ name: 'scope_text', type: 'text', nullable: true })
  scopeText: string | null;

  @Column({ type: 'enum', enum: RunStatus, default: RunStatus.PENDING })
  status: RunStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
