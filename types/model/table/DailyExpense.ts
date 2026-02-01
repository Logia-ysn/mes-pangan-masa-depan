import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { User } from '../../model/table/User'
import { ExpenseCategory } from '../../model/table/ExpenseCategory'

@Entity('DailyExpense')
export class DailyExpense extends BaseEntity {
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
  @ManyToOne(() => ExpenseCategory, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_expense_category' })
  otm_id_expense_category?: ExpenseCategory;
  @Column({
    name: 'id_expense_category',
    type: 'bigint',
    nullable: false,
  })
  id_expense_category!: number;
  @Column({
    type: 'date',
    nullable: false,
  })
  expense_date!: Date;
  @Column({
    type: 'decimal',
    nullable: false,
    precision: 15,
    scale: 2,
  })
  amount!: number;
  @Column({
    type: 'text',
    nullable: false,
  })
  description!: string;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 255,
  })
  receipt_url?: string;
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