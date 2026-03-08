import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Machine } from '../../model/table/Machine'
import { Factory } from '../../model/table/Factory'
import { User } from '../../model/table/User'

@Entity('DowntimeEvent')
export class DowntimeEvent extends BaseEntity {
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
  @ManyToOne(() => Factory, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_factory' })
  otm_id_factory?: Factory;
  @Column({
    name: 'id_factory',
    type: 'bigint',
    nullable: false,
  })
  id_factory!: number;
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
    type: 'timestamp',
    nullable: false,
  })
  start_time!: Date;
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  end_time?: Date;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  duration_minutes?: number;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 50,
    default: "UNPLANNED",
  })
  category!: string;
  @Column({
    type: 'text',
    nullable: true,
  })
  reason?: string;
  @Column({
    type: 'text',
    nullable: true,
  })
  resolution?: string;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 20,
    default: "OPEN",
  })
  status!: string;
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "NOW()",
  })
  created_at!: Date;
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "NOW()",
  })
  updated_at!: Date;
}