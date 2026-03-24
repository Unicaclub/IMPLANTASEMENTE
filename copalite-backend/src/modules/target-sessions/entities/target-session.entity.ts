import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { SessionStatus } from '../../../common/enums';
import { TargetEntity } from '../../targets/entities/target.entity';

@Entity('target_sessions')
export class TargetSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'target_id', type: 'uuid' })
  targetId: string;

  @ManyToOne(() => TargetEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  target: TargetEntity;

  @Column({ name: 'profile_name', type: 'varchar', length: 180, default: 'default' })
  profileName: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.PENDING })
  status: SessionStatus;

  @Column({ name: 'auth_mode', type: 'varchar', length: 40, default: 'none' })
  authMode: string;

  @Column({ name: 'session_data_json', type: 'jsonb', nullable: true })
  sessionDataJson: Record<string, unknown> | null;

  @Column({ name: 'last_validated_at', type: 'timestamptz', nullable: true })
  lastValidatedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
