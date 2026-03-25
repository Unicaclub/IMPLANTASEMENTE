import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { BrowserRunEntity } from '../../browser-runs/entities/browser-run.entity';

@Entity('browser_specs')
export class BrowserSpecEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'browser_run_id', type: 'uuid' })
  browserRunId: string;

  @ManyToOne(() => BrowserRunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'browser_run_id' })
  browserRun: BrowserRunEntity;

  @Column({ name: 'base_run_id', type: 'uuid', nullable: true })
  baseRunId: string | null;

  @Column({ name: 'markdown_content', type: 'text' })
  markdownContent: string;

  @Column({ name: 'spec_json', type: 'jsonb' })
  specJson: Record<string, unknown>;

  @Column({ name: 'pages_visited', type: 'int', default: 0 })
  pagesVisited: number;

  @Column({ name: 'problems_count', type: 'int', default: 0 })
  problemsCount: number;

  @Column({ name: 'max_severity', type: 'varchar', length: 20, nullable: true })
  maxSeverity: string | null;

  @Column({ name: 'overall_assessment', type: 'text', nullable: true })
  overallAssessment: string | null;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'spec_name', type: 'varchar', length: 255, nullable: true })
  specName: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
