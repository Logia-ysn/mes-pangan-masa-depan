import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import { Employee } from '../../model/table/Employee'
import { User } from '../../model/table/User'
import { AttendanceStatus } from '../../model/enum/AttendanceStatus'

@Entity('Attendance')
export class Attendance extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @ManyToOne(() => Employee, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_employee' })
  otm_id_employee?: Employee;
  @Column({
    name: 'id_employee',
    type: 'bigint',
    nullable: false,
  })
  id_employee!: number;
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
  attendance_date!: Date;
  @Column({
    type: 'time',
    nullable: true,
  })
  check_in_time?: Date;
  @Column({
    type: 'time',
    nullable: true,
  })
  check_out_time?: Date;
  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    nullable: false,
    default: 'PRESENT',
  })
  status!: AttendanceStatus;
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