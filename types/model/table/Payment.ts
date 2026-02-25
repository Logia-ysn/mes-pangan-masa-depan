import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Invoice } from '../../model/table/Invoice'
import { User } from '../../model/table/User'
import { PaymentMethodType } from '../../model/enum/PaymentMethodType'

@Entity('Payment')
export class Payment extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @ManyToOne(() => Invoice, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_invoice' })
  otm_id_invoice?: Invoice;
  @Column({
    name: 'id_invoice',
    type: 'bigint',
    nullable: false,
  })
  id_invoice!: number;
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
  payment_date!: Date;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  amount!: number;
  @Column({
    type: 'enum',
    enum: PaymentMethodType,
    nullable: false,
  })
  payment_method!: PaymentMethodType;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 100,
  })
  reference_number?: string;
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