import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OutputType, ValidationStatus } from '../../../common/enums';
import { AgentRunEntity } from '../../agent-runs/entities/agent-run.entity';

@Entity('agent_outputs')
export class AgentOutputEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_run_id', type: 'uuid' })
  agentRunId: string;

  @ManyToOne(() => AgentRunEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_run_id' })
  agentRun: AgentRunEntity;

  @Column({ name: 'output_type', type: 'enum', enum: OutputType })
  outputType: OutputType;

  @Column({ type: 'varchar', length: 220 })
  title: string;

  @Column({ name: 'content_markdown', type: 'text' })
  contentMarkdown: string;

  @Column({ name: 'structured_data_json', type: 'jsonb', nullable: true })
  structuredDataJson: Record<string, any> | null;

  @Column({ name: 'validation_status', type: 'enum', enum: ValidationStatus, default: ValidationStatus.PENDING })
  validationStatus: ValidationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
