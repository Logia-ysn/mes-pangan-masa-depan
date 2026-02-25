import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { ProductType } from '../../model/table/ProductType'

@Entity('Stock')
export class Stock extends BaseEntity {
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
    default: 0,
  })
  quantity!: number;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 20,
    default: "kg",
  })
  unit!: string;
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "NOW()",
  })
  updated_at!: Date;
}