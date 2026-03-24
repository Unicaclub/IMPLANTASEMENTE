import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { BrowserRunStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { TargetEntity } from '../../targets/entities/target.entity';
import { TargetSessionEntity } from '../../target-sessions/entities/target-session.entity';

@Entity('browser_runs')
export class BrowserRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @ManyToOne(() => TargetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  target: TargetEntity;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string | null;

  @ManyToOne(() => TargetSessionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'session_id' })
  session: TargetSessionEntity | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  module: string | null;

  @Column({ name: 'journey_name', type: 'varchar', length: 220, nullable: true })
  journeyName: string | null;

  @Column({ type: 'enum', enum: BrowserRunStatus, default: BrowserRunStatus.PENDING })
  status: BrowserRunStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ name: 'steps_count', type: 'int', default: 0 })
  stepsCount: number;

  @Column({ name: 'evidences_count', type: 'int', default: 0 })
  evidencesCount: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
