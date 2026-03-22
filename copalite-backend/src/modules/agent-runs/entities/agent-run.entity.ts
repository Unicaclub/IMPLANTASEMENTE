import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RunStatus, ConfidenceStatus } from '../../../common/enums';
import { RunEntity } from '../../runs/entities/run.entity';
import { AgentEntity } from '../../agents/entities/agent.entity';
import { PromptEntity } from '../../prompts/entities/prompt.entity';

@Entity('agent_runs')
export class AgentRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'run_id', type: 'uuid' })
  runId: string;

  @ManyToOne(() => RunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'run_id' })
  run: RunEntity;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId: string;

  @ManyToOne(() => AgentEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agent_id' })
  agent: AgentEntity;

  @Column({ name: 'prompt_id', type: 'uuid', nullable: true })
  promptId: string | null;

  @ManyToOne(() => PromptEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'prompt_id' })
  prompt: PromptEntity | null;

  @Column({ type: 'enum', enum: RunStatus, default: RunStatus.PENDING })
  status: RunStatus;

  @Column({ name: 'input_summary', type: 'text', nullable: true })
  inputSummary: string | null;

  @Column({ name: 'output_summary', type: 'text', nullable: true })
  outputSummary: string | null;

  @Column({ name: 'confidence_level', type: 'enum', enum: ConfidenceStatus, nullable: true })
  confidenceLevel: ConfidenceStatus | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
