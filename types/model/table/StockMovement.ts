import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Stock } from '../../model/table/Stock'
import { User } from '../../model/table/User'
import { MovementType } from '../../model/enum/MovementType'

@Entity('StockMovement')
export class StockMovement extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @ManyToOne(() => Stock, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_stock' })
  otm_id_stock?: Stock;
  @Column({
    name: 'id_stock',
    type: 'bigint',
    nullable: false,
  })
  id_stock!: number;
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
    type: 'enum',
    enum: MovementType,
    nullable: false,
  })
  movement_type!: MovementType;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  quantity!: number;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  reference_type?: string;
  @Column({
    type: 'bigint',
    nullable: true,
  })
  reference_id?: number;
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