import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";

@Entity('ProductType')
export class ProductType extends BaseEntity {
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
  @Column({
    type: 'varchar',
    nullable: false,
    length: 20,
    default: "kg",
  })
  unit!: string;
}