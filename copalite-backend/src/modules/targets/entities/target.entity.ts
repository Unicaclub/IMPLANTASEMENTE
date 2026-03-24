import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { TargetStatus } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('targets')
export class TargetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Column({ name: 'base_url', type: 'text' })
  baseUrl: string;

  @Column({ type: 'varchar', length: 80, default: 'staging' })
  environment: string;

  @Column({ name: 'system_type', type: 'varchar', length: 80, default: 'web_application' })
  systemType: string;

  @Column({ type: 'enum', enum: TargetStatus, default: TargetStatus.ACTIVE })
  status: TargetStatus;

  @Column({ name: 'auth_mode', type: 'varchar', length: 40, default: 'none' })
  authMode: string;

  @Column({ name: 'credentials_json', type: 'jsonb', nullable: true })
  credentialsJson: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
