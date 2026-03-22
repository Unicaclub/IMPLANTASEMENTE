import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { StatusBase } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { SourceEntity } from '../../sources/entities/source.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('documents')
@Unique(['projectId', 'slug'])
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'source_id', type: 'uuid', nullable: true })
  sourceId: string | null;

  @ManyToOne(() => SourceEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'source_id' })
  source: SourceEntity | null;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ type: 'varchar', length: 240 })
  slug: string;

  @Column({ name: 'document_type', type: 'varchar', length: 80 })
  documentType: string;

  @Column({ type: 'enum', enum: StatusBase, default: StatusBase.DRAFT })
  status: StatusBase;

  @Column({ name: 'content_markdown', type: 'text', default: '' })
  contentMarkdown: string;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: UserEntity | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
