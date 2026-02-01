import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { UserRole } from '../../model/enum/UserRole'
import { Factory } from '../../model/table/Factory'

@Entity('User')
export class User extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 100,
  })
  email!: string;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 255,
  })
  password_hash!: string;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 200,
  })
  fullname!: string;
  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false,
    default: 'OPERATOR',
  })
  role!: UserRole;
  @ManyToOne(() => Factory, x => x.id, { nullable: true })
  @JoinColumn({ name: 'id_factory' })
  otm_id_factory?: Factory;
  @Column({
    name: 'id_factory',
    type: 'bigint',
    nullable: true,
  })
  id_factory?: number;
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
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => "NOW()",
  })
  updated_at!: Date;
}