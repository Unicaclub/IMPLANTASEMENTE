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
import { SchemaRegistryEntity } from './schema-registry.entity';

@Entity('schema_fields')
@Unique(['schemaRegistryId', 'fieldName'])
export class SchemaFieldEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'schema_registry_id', type: 'uuid' })
  schemaRegistryId: string;

  @ManyToOne(() => SchemaRegistryEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schema_registry_id' })
  schemaRegistry: SchemaRegistryEntity;

  @Column({ name: 'field_name', type: 'varchar', length: 180 })
  fieldName: string;

  @Column({ name: 'data_type', type: 'varchar', length: 80 })
  dataType: string;

  @Column({ name: 'is_nullable', type: 'boolean', default: true })
  isNullable: boolean;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_unique', type: 'boolean', default: false })
  isUnique: boolean;

  @Column({ name: 'default_value', type: 'text', nullable: true })
  defaultValue: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
