import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UiRegistryEntity } from './ui-registry.entity';
import { RouteRegistryEntity } from '../../route-registry/entities/route-registry.entity';
import { ApiRegistryEntity } from '../../api-registry/entities/api-registry.entity';

@Entity('ui_actions')
export class UiActionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ui_registry_id', type: 'uuid' })
  uiRegistryId: string;

  @ManyToOne(() => UiRegistryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ui_registry_id' })
  uiRegistry: UiRegistryEntity;

  @Column({ name: 'action_name', type: 'varchar', length: 180 })
  actionName: string;

  @Column({ name: 'action_type', type: 'varchar', length: 100 })
  actionType: string;

  @Column({ name: 'target_route_id', type: 'uuid', nullable: true })
  targetRouteId: string | null;

  @ManyToOne(() => RouteRegistryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'target_route_id' })
  targetRoute: RouteRegistryEntity | null;

  @Column({ name: 'target_api_id', type: 'uuid', nullable: true })
  targetApiId: string | null;

  @ManyToOne(() => ApiRegistryEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'target_api_id' })
  targetApi: ApiRegistryEntity | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
