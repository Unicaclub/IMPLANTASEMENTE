import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { RunEntity } from '../../runs/entities/run.entity';

@Entity('audits')
export class AuditEntity {
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

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ name: 'audit_type', type: 'varchar', length: 80 })
  auditType: string;

  @Column({ name: 'scope_text', type: 'text', nullable: true })
  scopeText: string | null;

  @Column({ type: 'text' })
  summary: string;

  @Column({ name: 'result_status', type: 'varchar', length: 40 })
  resultStatus: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
