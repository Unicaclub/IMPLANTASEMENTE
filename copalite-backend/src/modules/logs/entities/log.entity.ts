import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { LogLevel } from '../../../common/enums';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { RunEntity } from '../../runs/entities/run.entity';
import { AgentRunEntity } from '../../agent-runs/entities/agent-run.entity';

@Entity('logs')
export class LogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @ManyToOne(() => ProjectEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity | null;

  @Column({ name: 'run_id', type: 'uuid', nullable: true })
  runId: string | null;

  @ManyToOne(() => RunEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'run_id' })
  run: RunEntity | null;

  @Column({ name: 'agent_run_id', type: 'uuid', nullable: true })
  agentRunId: string | null;

  @ManyToOne(() => AgentRunEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'agent_run_id' })
  agentRun: AgentRunEntity | null;

  @Column({ name: 'log_level', type: 'enum', enum: LogLevel })
  logLevel: LogLevel;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'context_json', type: 'jsonb', nullable: true })
  contextJson: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
