import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { Factory } from '../../model/table/Factory'

@Entity('ProductionLine')
export class ProductionLine extends BaseEntity {
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
        length: 30,
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
    })
    description?: string;
    @Column({
        type: 'boolean',
        nullable: false,
        default: true,
    })
    is_active!: boolean;
    @Column({
        type: 'decimal',
        nullable: true,
        precision: 10,
        scale: 2,
    })
    capacity_per_hour?: number;
}
