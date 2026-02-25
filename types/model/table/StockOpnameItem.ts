import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { StockOpname } from '../../model/table/StockOpname'
import { Stock } from '../../model/table/Stock'

@Entity('StockOpnameItem')
export class StockOpnameItem extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @ManyToOne(() => StockOpname, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_stock_opname' })
  otm_id_stock_opname?: StockOpname;
  @Column({
    name: 'id_stock_opname',
    type: 'bigint',
    nullable: false,
  })
  id_stock_opname!: number;
  @ManyToOne(() => Stock, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_stock' })
  otm_id_stock?: Stock;
  @Column({
    name: 'id_stock',
    type: 'bigint',
    nullable: false,
  })
  id_stock!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  system_quantity!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  actual_quantity!: number;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  difference!: number;
  @Column({
    type: 'text',
    nullable: true,
  })
  notes?: string;
}