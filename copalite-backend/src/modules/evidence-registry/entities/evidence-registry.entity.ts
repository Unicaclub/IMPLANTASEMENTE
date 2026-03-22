import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EvidenceType, ConfidenceStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { RunEntity } from '../../runs/entities/run.entity';
import { SourceEntity } from '../../sources/entities/source.entity';

@Entity('evidence_registry')
export class EvidenceRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'run_id', type: 'uuid' })
  runId: string;

  @ManyToOne(() => RunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'run_id' })
  run: RunEntity;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @ManyToOne(() => SourceEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_id' })
  source: SourceEntity | null;

  @Column({ name: 'evidence_type', type: 'enum', enum: EvidenceType })
  evidenceType: EvidenceType;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ name: 'content_excerpt', type: 'text' })
  contentExcerpt: string;

  @Column({ name: 'reference_path', type: 'text', nullable: true })
  referencePath: string | null;

  @Column({ name: 'reference_url', type: 'text', nullable: true })
  referenceUrl: string | null;

  @Column({ name: 'related_entity_type', type: 'varchar', length: 80 })
  relatedEntityType: string;

  @Column({ name: 'related_entity_id', type: 'uuid' })
  relatedEntityId: string;

  @Column({ name: 'confidence_status', type: 'enum', enum: ConfidenceStatus, default: ConfidenceStatus.UNVALIDATED })
  confidenceStatus: ConfidenceStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
