import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { Factory } from './Factory';

@Entity('OutputProduct')
export class OutputProduct extends BaseEntity {
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
        length: 100,
    })
    name!: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    description?: string;

    @Column({
        type: 'int',
        nullable: false,
        default: 0,
    })
    display_order!: number;

    @Column({
        type: 'boolean',
        nullable: false,
        default: true,
    })
    is_active!: boolean;

    @Column({
        type: 'timestamp',
        nullable: false,
        default: () => "NOW()",
    })
    created_at!: Date;
}
