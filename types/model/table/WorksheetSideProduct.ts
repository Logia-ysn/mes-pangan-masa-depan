import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Worksheet } from './Worksheet';

@Entity('WorksheetSideProduct')
export class WorksheetSideProduct extends BaseEntity {
    @Column({
        type: 'bigint',
        nullable: false,
    })
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @ManyToOne(() => Worksheet, x => x.id, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_worksheet' })
    otm_id_worksheet?: Worksheet;

    @Column({
        name: 'id_worksheet',
        type: 'bigint',
        nullable: false,
    })
    id_worksheet!: number;

    @Column({
        type: 'varchar',
        nullable: false,
        length: 30,
    })
    product_code!: string;

    @Column({
        type: 'varchar',
        nullable: false,
        length: 100,
    })
    product_name!: string;

    @Column({
        type: 'decimal',
        nullable: false,
        precision: 15,
        scale: 2,
        default: 0,
    })
    quantity!: number;

    @Column({
        type: 'boolean',
        nullable: false,
        default: false,
    })
    is_auto_calculated!: boolean;

    @Column({
        type: 'decimal',
        nullable: true,
        precision: 10,
        scale: 2,
    })
    auto_percentage?: number;

    @Column({
        type: 'decimal',
        nullable: true,
        precision: 15,
        scale: 2,
    })
    unit_price?: number;

    @Column({
        type: 'decimal',
        nullable: true,
        precision: 15,
        scale: 2,
    })
    total_value?: number;

    @Column({
        type: 'timestamp',
        nullable: false,
        default: () => "NOW()",
    })
    created_at!: Date;
}
