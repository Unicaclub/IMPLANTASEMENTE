import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StatusBase, SourceType, AuthMode } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('sources')
export class SourceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Column({ name: 'source_type', type: 'enum', enum: SourceType })
  sourceType: SourceType;

  @Column({ type: 'text' })
  location: string;

  @Column({ type: 'enum', enum: StatusBase, default: StatusBase.ACTIVE })
  status: StatusBase;

  @Column({ name: 'auth_mode', type: 'enum', enum: AuthMode, default: AuthMode.NONE })
  authMode: AuthMode;

  @Column({ name: 'credentials_ref', type: 'varchar', length: 255, nullable: true })
  credentialsRef: string | null;

  @Column({ name: 'connection_config_json', type: 'jsonb', nullable: true })
  connectionConfigJson: Record<string, any> | null;

  @Column({ name: 'sync_last_at', type: 'timestamptz', nullable: true })
  syncLastAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
