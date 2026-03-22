import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusBase, RouteType, ConfidenceStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { RunEntity } from '../../runs/entities/run.entity';
import { ModuleRegistryEntity } from '../../modules-registry/entities/module-registry.entity';
import { SourceEntity } from '../../sources/entities/source.entity';

@Entity('route_registry')
export class RouteRegistryEntity {
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

  @Column({ name: 'module_id', type: 'uuid', nullable: true })
  moduleId: string | null;

  @ManyToOne(() => ModuleRegistryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'module_id' })
  module: ModuleRegistryEntity | null;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @ManyToOne(() => SourceEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_id' })
  source: SourceEntity | null;

  @Column({ name: 'route_type', type: 'enum', enum: RouteType })
  routeType: RouteType;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method: string | null;

  @Column({ name: 'screen_name', type: 'varchar', length: 180, nullable: true })
  screenName: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: StatusBase, default: StatusBase.ACTIVE })
  status: StatusBase;

  @Column({ name: 'confidence_status', type: 'enum', enum: ConfidenceStatus, default: ConfidenceStatus.UNVALIDATED })
  confidenceStatus: ConfidenceStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
