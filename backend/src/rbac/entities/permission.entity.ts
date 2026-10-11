import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  /** Resource group, e.g. `employees`. Validated against the registry. */
  @Column()
  group: string;

  /** `view` or `manage`. Validated against the registry. */
  @Column()
  action: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
