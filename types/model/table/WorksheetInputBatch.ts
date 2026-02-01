import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Worksheet } from './Worksheet';
import { Stock } from './Stock';

@Entity('WorksheetInputBatch')
export class WorksheetInputBatch extends BaseEntity {
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

    @ManyToOne(() => Stock, x => x.id, { nullable: false })
    @JoinColumn({ name: 'id_stock' })
    otm_id_stock?: Stock;

    @Column({
        name: 'id_stock',
        type: 'bigint',
        nullable: false,
    })
    id_stock!: number;

    @Column({
        type: 'varchar',
        nullable: true,
        length: 50,
    })
    batch_code?: string;

    @Column({
        type: 'decimal',
        nullable: false,
        precision: 15,
        scale: 2,
    })
    quantity!: number;

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
    total_cost?: number;

    @Column({
        type: 'timestamp',
        nullable: false,
        default: () => "NOW()",
    })
    created_at!: Date;
}
