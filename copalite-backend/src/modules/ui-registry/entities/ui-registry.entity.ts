import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusBase, UiStateType, ConfidenceStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { RunEntity } from '../../runs/entities/run.entity';
import { SourceEntity } from '../../sources/entities/source.entity';

@Entity('ui_registry')
export class UiRegistryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'run_id', type: 'uuid', nullable: true })
  runId: string | null;

  @ManyToOne(() => RunEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'run_id' })
  run: RunEntity | null;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @ManyToOne(() => SourceEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_id' })
  source: SourceEntity | null;

  @Column({ name: 'screen_name', type: 'varchar', length: 180 })
  screenName: string;

  @Column({ name: 'route_path', type: 'text', nullable: true })
  routePath: string | null;

  @Column({ name: 'component_name', type: 'varchar', length: 180, nullable: true })
  componentName: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'state_type', type: 'enum', enum: UiStateType, nullable: true })
  stateType: UiStateType | null;

  @Column({ type: 'enum', enum: StatusBase, default: StatusBase.ACTIVE })
  status: StatusBase;

  @Column({ name: 'confidence_status', type: 'enum', enum: ConfidenceStatus, default: ConfidenceStatus.UNVALIDATED })
  confidenceStatus: ConfidenceStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
