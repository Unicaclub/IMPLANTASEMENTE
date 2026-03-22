import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusBase, ConfidenceStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { RunEntity } from '../../runs/entities/run.entity';
import { ModuleRegistryEntity } from '../../modules-registry/entities/module-registry.entity';
import { RouteRegistryEntity } from '../../route-registry/entities/route-registry.entity';
import { SourceEntity } from '../../sources/entities/source.entity';

@Entity('api_registry')
export class ApiRegistryEntity {
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

  @Column({ name: 'route_id', type: 'uuid', nullable: true })
  routeId: string | null;

  @ManyToOne(() => RouteRegistryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'route_id' })
  route: RouteRegistryEntity | null;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @ManyToOne(() => SourceEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_id' })
  source: SourceEntity | null;

  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Column({ name: 'http_method', type: 'varchar', length: 10 })
  httpMethod: string;

  @Column({ type: 'text' })
  path: string;

  @Column({ name: 'auth_required', type: 'boolean', default: false })
  authRequired: boolean;

  @Column({ name: 'request_schema_json', type: 'jsonb', nullable: true })
  requestSchemaJson: Record<string, any> | null;

  @Column({ name: 'response_schema_json', type: 'jsonb', nullable: true })
  responseSchemaJson: Record<string, any> | null;

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
