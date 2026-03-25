import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { StepResultStatus } from '../../../common/enums';
import { JourneyRunEntity } from './journey-run.entity';

@Entity('journey_step_results')
export class JourneyStepResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'journey_run_id', type: 'uuid' })
  journeyRunId: string;

  @ManyToOne(() => JourneyRunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journey_run_id' })
  journeyRun: JourneyRunEntity;

  @Column({ name: 'step_index', type: 'int' })
  stepIndex: number;

  @Column({ type: 'varchar', length: 220 })
  action: string;

  @Column({ type: 'text', nullable: true })
  route: string | null;

  @Column({ type: 'text', nullable: true })
  expected: string | null;

  @Column({ type: 'text', nullable: true })
  observed: string | null;

  @Column({ type: 'enum', enum: StepResultStatus, default: StepResultStatus.PASSED })
  status: StepResultStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'screenshot_path', type: 'text', nullable: true })
  screenshotPath: string | null;

  @Column({ name: 'evidence_refs', type: 'jsonb', nullable: true })
  evidenceRefs: Record<string, unknown> | null;

  @Column({ name: 'duration_ms', type: 'int', default: 0 })
  durationMs: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
