import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ComparisonType, ComparisonResultStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { RunEntity } from '../../runs/entities/run.entity';

@Entity('comparisons')
export class ComparisonEntity {
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

  @Column({ name: 'comparison_type', type: 'enum', enum: ComparisonType })
  comparisonType: ComparisonType;

  @Column({ name: 'source_a_type', type: 'varchar', length: 80 })
  sourceAType: string;

  @Column({ name: 'source_a_ref', type: 'text' })
  sourceARef: string;

  @Column({ name: 'source_b_type', type: 'varchar', length: 80 })
  sourceBType: string;

  @Column({ name: 'source_b_ref', type: 'text' })
  sourceBRef: string;

  @Column({ name: 'result_status', type: 'enum', enum: ComparisonResultStatus })
  resultStatus: ComparisonResultStatus;

  @Column({ type: 'text' })
  summary: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
