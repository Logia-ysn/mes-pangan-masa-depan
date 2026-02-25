import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Invoice } from '../../model/table/Invoice'
import { User } from '../../model/table/User'

@Entity('DeliveryOrder')
export class DeliveryOrder extends BaseEntity {
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
    type: 'varchar',
    nullable: false,
    length: 50,
  })
  do_number!: string;
  @Column({
    type: 'date',
    nullable: false,
  })
  delivery_date!: Date;
  @Column({
    type: 'date',
    nullable: true,
  })
  received_date?: Date;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 100,
  })
  driver_name?: string;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 20,
  })
  vehicle_number?: string;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 20,
    default: "PENDING",
  })
  status!: string;
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