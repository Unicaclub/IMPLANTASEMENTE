import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { ProblemType, ProblemSeverity } from '../../../common/enums';
import { BrowserRunEntity } from '../../browser-runs/entities/browser-run.entity';

@Entity('browser_problems')
export class BrowserProblemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'browser_run_id', type: 'uuid' })
  browserRunId: string;

  @ManyToOne(() => BrowserRunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'browser_run_id' })
  browserRun: BrowserRunEntity;

  @Column({ type: 'enum', enum: ProblemType })
  type: ProblemType;

  @Column({ type: 'enum', enum: ProblemSeverity })
  severity: ProblemSeverity;

  @Column({ type: 'text' })
  route: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'varchar', length: 64 })
  fingerprint: string;

  @Column({ name: 'metadata_json', type: 'jsonb', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
