import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Invoice } from '../../model/table/Invoice'
import { ProductType } from '../../model/table/ProductType'

@Entity('InvoiceItem')
export class InvoiceItem extends BaseEntity {
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
  @ManyToOne(() => ProductType, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_product_type' })
  otm_id_product_type?: ProductType;
  @Column({
    name: 'id_product_type',
    type: 'bigint',
    nullable: false,
  })
  id_product_type!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  quantity!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  unit_price!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  subtotal!: number;
}