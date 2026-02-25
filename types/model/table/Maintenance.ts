import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Machine } from '../../model/table/Machine'
import { User } from '../../model/table/User'
import { MaintenanceType } from '../../model/enum/MaintenanceType'

@Entity('Maintenance')
export class Maintenance extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @ManyToOne(() => Machine, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_machine' })
  otm_id_machine?: Machine;
  @Column({
    name: 'id_machine',
    type: 'bigint',
    nullable: false,
  })
  id_machine!: number;
  @ManyToOne(() => User, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_user' })
  otm_id_user?: User;
  @Column({
    name: 'id_user',
    type: 'bigint',
    nullable: false,
  })
  id_user!: number;
  @Column({
    type: 'enum',
    enum: MaintenanceType,
    nullable: false,
  })
  maintenance_type!: MaintenanceType;
  @Column({
    type: 'date',
    nullable: false,
  })
  maintenance_date!: Date;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
    default: 0,
  })
  cost!: number;
  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;
  @Column({
    type: 'text',
    nullable: true,
  })
  parts_replaced?: string;
  @Column({
    type: 'date',
    nullable: true,
  })
  next_maintenance_date?: Date;
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "NOW()",
  })
  created_at!: Date;
}