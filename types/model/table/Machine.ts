import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { MachineStatus } from '../../model/enum/MachineStatus'

@Entity('Machine')
export class Machine extends BaseEntity {
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
  @Column({
    type: 'varchar',
    nullable: false,
    length: 50,
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
    length: 100,
  })
  machine_type?: string;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  capacity_per_hour?: number;
  @Column({
    type: 'enum',
    enum: MachineStatus,
    nullable: false,
    default: 'ACTIVE',
  })
  status!: MachineStatus;
  @Column({
    type: 'date',
    nullable: true,
  })
  last_maintenance_date?: Date;
  @Column({
    type: 'date',
    nullable: true,
  })
  next_maintenance_date?: Date;
}