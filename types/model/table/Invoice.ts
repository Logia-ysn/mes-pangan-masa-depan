import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { Customer } from '../../model/table/Customer'
import { User } from '../../model/table/User'
import { InvoiceStatus } from '../../model/enum/InvoiceStatus'

@Entity('Invoice')
export class Invoice extends BaseEntity {
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
  @ManyToOne(() => Customer, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_customer' })
  otm_id_customer?: Customer;
  @Column({
    name: 'id_customer',
    type: 'bigint',
    nullable: false,
  })
  id_customer!: number;
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
  invoice_number!: string;
  @Column({
    type: 'date',
    nullable: false,
  })
  invoice_date!: Date;
  @Column({
    type: 'date',
    nullable: false,
  })
  due_date!: Date;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
    default: 0,
  })
  subtotal!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
    default: 0,
  })
  tax!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
    default: 0,
  })
  discount!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
    default: 0,
  })
  total!: number;
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    nullable: false,
    default: 'DRAFT',
  })
  status!: InvoiceStatus;
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