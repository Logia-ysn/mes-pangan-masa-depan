/**
 * @deprecated This TypeORM model is DEAD CODE. The project uses Prisma as its ORM.
 * Use Prisma-generated types from '@prisma/client' instead.
 * Scheduled for deletion in Phase 5 of the worksheet refactoring.
 * See: REFACTOR-WORKSHEET-PLAN.md
 */
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { User } from '../../model/table/User'
import { WorkshiftType } from '../../model/enum/WorkshiftType'
import { Machine } from '../../model/table/Machine'
import { ProductType } from '../../model/table/ProductType'

/** @deprecated Use Prisma Worksheet type instead */
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
  @ManyToOne(() => Machine, x => x.id, { nullable: true })
  @JoinColumn({ name: 'id_machine' })
  otm_id_machine?: Machine;
  @Column({
    name: 'id_machine',
    type: 'bigint',
    nullable: true,
  })
  id_machine?: number;
  @ManyToOne(() => ProductType, x => x.id, { nullable: true })
  @JoinColumn({ name: 'id_output_product' })
  otm_id_output_product?: ProductType;
  @Column({
    name: 'id_output_product',
    type: 'bigint',
    nullable: true,
  })
  id_output_product?: number;
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