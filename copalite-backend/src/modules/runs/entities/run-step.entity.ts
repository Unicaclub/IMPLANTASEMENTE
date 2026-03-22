import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { RunStatus } from '../../../common/enums';
import { RunEntity } from './run.entity';

@Entity('run_steps')
@Unique(['runId', 'stepOrder'])
export class RunStepEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'run_id', type: 'uuid' })
  runId: string;

  @ManyToOne(() => RunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'run_id' })
  run: RunEntity;

  @Column({ name: 'step_order', type: 'int' })
  stepOrder: number;

  @Column({ name: 'step_name', type: 'varchar', length: 180 })
  stepName: string;

  @Column({ name: 'step_type', type: 'varchar', length: 80 })
  stepType: string;

  @Column({ type: 'enum', enum: RunStatus, default: RunStatus.PENDING })
  status: RunStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
