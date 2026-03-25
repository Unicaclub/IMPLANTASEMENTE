import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { JourneyStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { TargetEntity } from '../../targets/entities/target.entity';

@Entity('journey_runs')
export class JourneyRunEntity {
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

  @Column({ type: 'varchar', length: 220 })
  name: string;

  @Column({ type: 'varchar', length: 220 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: JourneyStatus, default: JourneyStatus.PENDING })
  status: JourneyStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ name: 'duration_ms', type: 'int', default: 0 })
  durationMs: number;

  @Column({ name: 'total_steps', type: 'int', default: 0 })
  totalSteps: number;

  @Column({ name: 'passed_steps', type: 'int', default: 0 })
  passedSteps: number;

  @Column({ name: 'failed_steps', type: 'int', default: 0 })
  failedSteps: number;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ name: 'metadata_json', type: 'jsonb', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
