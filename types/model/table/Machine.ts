import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Factory } from '../../model/table/Factory'
import { Supplier } from '../../model/table/Supplier'
import { ProcessCategory } from '../../model/table/ProcessCategory'
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

  @ManyToOne(() => Supplier, x => x.id, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  otm_vendor?: Supplier;

  @Column({
    name: 'vendor_id',
    type: 'int',
    nullable: true,
  })
  vendor_id?: number;

  @ManyToOne(() => ProcessCategory, x => x.id, { nullable: true })
  @JoinColumn({ name: 'id_process_category' })
  otm_id_process_category?: ProcessCategory;

  @Column({
    name: 'id_process_category',
    type: 'int',
    nullable: true,
  })
  id_process_category?: number;

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
    type: 'varchar',
    nullable: true,
    length: 100,
  })
  serial_number?: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  manufacture_year?: number;

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
  purchase_date?: Date;

  @Column({
    type: 'decimal',
    nullable: true,
    precision: 15,
    scale: 2,
  })
  purchase_price?: number;

  @Column({
    type: 'int',
    nullable: true,
  })
  warranty_months?: number;

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
