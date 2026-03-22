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
import { StatusBase, PromptType } from '../../../common/enums';
import { AgentEntity } from '../../agents/entities/agent.entity';

@Entity('prompts')
@Unique(['agentId', 'name', 'version'])
export class PromptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId: string;

  @ManyToOne(() => AgentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent: AgentEntity;

  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Column({ name: 'prompt_type', type: 'enum', enum: PromptType })
  promptType: PromptType;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'content_markdown', type: 'text' })
  contentMarkdown: string;

  @Column({ type: 'enum', enum: StatusBase, default: StatusBase.ACTIVE })
  status: StatusBase;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
