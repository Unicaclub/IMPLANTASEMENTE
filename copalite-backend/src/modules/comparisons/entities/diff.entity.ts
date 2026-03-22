import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SeverityLevel } from '../../../common/enums';
import { ComparisonEntity } from './comparison.entity';

@Entity('diffs')
export class DiffEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comparison_id', type: 'uuid' })
  comparisonId: string;

  @ManyToOne(() => ComparisonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comparison_id' })
  comparison: ComparisonEntity;

  @Column({ name: 'diff_type', type: 'varchar', length: 100 })
  diffType: string;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: SeverityLevel, default: SeverityLevel.MEDIUM })
  severity: SeverityLevel;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
