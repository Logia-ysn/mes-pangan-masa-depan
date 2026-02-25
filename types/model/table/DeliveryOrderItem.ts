import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { DeliveryOrder } from '../../model/table/DeliveryOrder'
import { InvoiceItem } from '../../model/table/InvoiceItem'

@Entity('DeliveryOrderItem')
export class DeliveryOrderItem extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @ManyToOne(() => DeliveryOrder, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_delivery_order' })
  otm_id_delivery_order?: DeliveryOrder;
  @Column({
    name: 'id_delivery_order',
    type: 'bigint',
    nullable: false,
  })
  id_delivery_order!: number;
  @ManyToOne(() => InvoiceItem, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_invoice_item' })
  otm_id_invoice_item?: InvoiceItem;
  @Column({
    name: 'id_invoice_item',
    type: 'bigint',
    nullable: false,
  })
  id_invoice_item!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  quantity_delivered!: number;
}