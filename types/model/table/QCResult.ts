import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { User } from '../../model/table/User'
import { Worksheet } from '../../model/table/Worksheet'

@Entity('QCResult')
export class QCResult extends BaseEntity {
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
  @Column({
    type: 'date',
    nullable: false,
  })
  qc_date!: Date;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  batch_code?: string;
  @ManyToOne(() => Worksheet, x => x.id, { nullable: true })
  @JoinColumn({ name: 'id_worksheet' })
  otm_id_worksheet?: Worksheet;
  @Column({
    name: 'id_worksheet',
    type: 'bigint',
    nullable: true,
  })
  id_worksheet?: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 5,
    scale: 2,
  })
  moisture_content?: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 5,
    scale: 2,
  })
  broken_percentage?: number;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 5,
    scale: 2,
  })
  whiteness_degree?: number;
  @Column({
    type: 'varchar',
    nullable: true,
    length: 50,
  })
  grade?: string;
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