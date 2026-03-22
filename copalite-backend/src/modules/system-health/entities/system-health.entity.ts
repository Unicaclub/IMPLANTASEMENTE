import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('system_health')
export class SystemHealthEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'component_name', type: 'varchar', length: 180 })
  componentName: string;

  @Column({ name: 'component_type', type: 'varchar', length: 80 })
  componentType: string;

  @Column({ type: 'varchar', length: 40 })
  status: string;

  @Column({ name: 'details_json', type: 'jsonb', nullable: true })
  detailsJson: Record<string, any> | null;

  @Column({ name: 'checked_at', type: 'timestamptz', default: () => 'now()' })
  checkedAt: Date;
}
