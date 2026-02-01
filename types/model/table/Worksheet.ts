import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { User } from '../../model/table/User'
import { OutputProduct } from '../../model/table/OutputProduct'
import { WorkshiftType } from '../../model/enum/WorkshiftType'
import { Machine } from '../../model/table/Machine'
import { WorksheetInputBatch } from '../../model/table/WorksheetInputBatch'

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

  @ManyToOne(() => OutputProduct, x => x.id, { nullable: true })
  @JoinColumn({ name: 'id_output_product' })
  otm_id_output_product?: OutputProduct;

  @Column({
    name: 'id_output_product',
    type: 'bigint',
    nullable: true,
  })
  id_output_product?: number;

  @ManyToOne(() => Machine, x => x.id, { nullable: true })
  @JoinColumn({ name: 'id_machine' })
  otm_id_machine?: Machine;

  @Column({
    name: 'id_machine',
    type: 'bigint',
    nullable: true,
  })
  id_machine?: number;

  @OneToMany(() => WorksheetInputBatch, x => x.otm_id_worksheet)
  input_batches?: WorksheetInputBatch[];

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
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  batch_code?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  process_steps?: string; // JSON array of process step codes

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
    name: 'input_batch_id',
    type: 'bigint',
    nullable: true,
  })
  input_batch_id?: number;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 20,
  })
  input_category_code?: string;

  @Column({
    type: 'varchar',
    nullable: true,
    length: 30,
  })
  process_step?: string; // Legacy single process step

  // HPP Related Fields
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 15,
    scale: 2,
    default: 0,
  })
  production_cost?: number;

  @Column({
    type: 'decimal',
    nullable: true,
    precision: 15,
    scale: 2,
    default: 0,
  })
  raw_material_cost?: number;

  @Column({
    type: 'decimal',
    nullable: true,
    precision: 15,
    scale: 2,
    default: 0,
  })
  side_product_revenue?: number;

  @Column({
    type: 'decimal',
    nullable: true,
    precision: 15,
    scale: 2,
    default: 0,
  })
  hpp?: number;

  @Column({
    type: 'decimal',
    nullable: true,
    precision: 15,
    scale: 2,
  })
  hpp_per_kg?: number;

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