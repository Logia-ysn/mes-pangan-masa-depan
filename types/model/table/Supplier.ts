import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";

@Entity('Supplier')
export class Supplier extends BaseEntity {
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
    length: 200,
  })
  name!: string;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 200,
  })
  contact_person?: string;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 20,
  })
  phone?: string;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 100,
  })
  email?: string;
  @Column({
    type: 'text',
    nullable: true,
  })
  address?: string;
  @Column({
    type: 'boolean',
    nullable: false,
    default: () => "true",
  })
  is_active!: boolean;
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "NOW()",
  })
  created_at!: Date;
}