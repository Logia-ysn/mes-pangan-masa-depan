import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";

@Entity('ExpenseCategory')
export class ExpenseCategory extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 20,
  })
  code!: string;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 100,
  })
  name!: string;
  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;
}