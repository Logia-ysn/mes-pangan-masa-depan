import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { User } from '../../model/table/User'
import { Gender } from '../../model/enum/Gender'
import { EmploymentStatus } from '../../model/enum/EmploymentStatus'

@Entity('Employee')
export class Employee extends BaseEntity {
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
  @ManyToOne(() => User, x => x.id, { nullable: true })
  @JoinColumn({ name: 'id_user' })
  otm_id_user?: User;
  @Column({
    name: 'id_user',
    type: 'bigint',
    nullable: true,
  })
  id_user?: number;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 20,
  })
  employee_code!: string;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 200,
  })
  fullname!: string;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 16,
  })
  nik?: string;
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
    type: 'date',
    nullable: true,
  })
  birth_date?: Date;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 100,
  })
  birth_place?: string;
  @Column({
    type: 'enum',
    enum: Gender,
    nullable: false,
  })
  gender!: Gender;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  religion?: string;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  marital_status?: string;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 100,
  })
  position!: string;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 100,
  })
  department?: string;
  @Column({
    type: 'date',
    nullable: false,
  })
  join_date!: Date;
  @Column({
    type: 'enum',
    enum: EmploymentStatus,
    nullable: false,
    default: 'PERMANENT',
  })
  employment_status!: EmploymentStatus;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 15,
    scale: 2,
  })
  salary?: number;
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