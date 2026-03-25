import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EvidenceKind } from '../../../common/enums';
import { BrowserRunEntity } from '../../browser-runs/entities/browser-run.entity';

@Entity('browser_evidences')
export class BrowserEvidenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'browser_run_id', type: 'uuid' })
  browserRunId: string;

  @ManyToOne(() => BrowserRunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'browser_run_id' })
  browserRun: BrowserRunEntity;

  @Column({ name: 'step_index', type: 'int', default: 0 })
  stepIndex: number;

  @Column({ type: 'enum', enum: EvidenceKind })
  kind: EvidenceKind;

  @Column({ type: 'text', nullable: true })
  route: string | null;

  @Column({ type: 'varchar', length: 220, nullable: true })
  action: string | null;

  @Column({ name: 'artifact_url', type: 'text', nullable: true })
  artifactUrl: string | null;

  @Column({ name: 'storage_key', type: 'text', nullable: true })
  storageKey: string | null;

  @Column({ name: 'metadata_json', type: 'jsonb', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
