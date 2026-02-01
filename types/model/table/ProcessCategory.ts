import { Column, Entity, PrimaryGeneratedColumn, BaseEntity } from "typeorm";

@Entity('ProcessCategory')
export class ProcessCategory extends BaseEntity {
    @Column({
        type: 'bigint',
        nullable: false,
    })
    @PrimaryGeneratedColumn('increment')
    id!: number;

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
        type: 'boolean',
        nullable: false,
        default: true,
    })
    is_main_process!: boolean;

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
