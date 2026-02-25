import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { User } from '../../model/table/User'

@Entity('DryingLog')
export class DryingLog extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
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
    type: 'varchar',
    nullable: false,
    length: 50,
  })
  batch_code!: string;
  @Column({
    type: 'date',
    nullable: false,
  })
  drying_date!: Date;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 50,
    default: "SUN_DRY",
  })
  method!: string;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  initial_weight!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  final_weight!: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 5,
    scale: 2,
  })
  initial_moisture?: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 5,
    scale: 2,
  })
  final_moisture?: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 5,
    scale: 2,
  })
  downtime_hours?: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 15,
    scale: 2,
  })
  shrinkage_kg?: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 5,
    scale: 2,
  })
  shrinkage_pct?: number;
  @Column({
    type: 'text',
    nullable: true,
  })
  notes?: string;
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "NOW()",
  })
  created_at!: Date;
}