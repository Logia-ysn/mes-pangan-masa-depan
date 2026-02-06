import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { User } from '../../model/table/User'
import { WorkshiftType } from '../../model/enum/WorkshiftType'

@Entity('Worksheet')
export class Worksheet extends BaseEntity {
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

  @ManyToOne("Machine", "id", { nullable: true })
  @JoinColumn({ name: 'id_machine' })
  otm_id_machine?: any;

  @Column({ type: 'bigint', nullable: true })
  id_machine?: number;

  @ManyToOne("OutputProduct", "id", { nullable: true })
  @JoinColumn({ name: 'id_output_product' })
  otm_id_output_product?: any;

  @Column({ type: 'bigint', nullable: true })
  id_output_product?: number;
  @Column({
    type: 'date',
    nullable: false,
  })
  worksheet_date!: Date;
  @Column({
    type: 'enum',
    enum: WorkshiftType,
    nullable: false,
  })
  shift!: WorkshiftType;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  gabah_input!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  beras_output!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
    default: 0,
  })
  menir_output!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
    default: 0,
  })
  dedak_output!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
    default: 0,
  })
  sekam_output!: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 5,
    scale: 2,
  })
  rendemen?: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 5,
    scale: 2,
    default: 0,
  })
  machine_hours!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 5,
    scale: 2,
    default: 0,
  })
  downtime_hours!: number;
  @Column({
    type: 'text',
    nullable: true,
  })
  downtime_reason?: string;
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
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "NOW()",
  })
  updated_at!: Date;
}