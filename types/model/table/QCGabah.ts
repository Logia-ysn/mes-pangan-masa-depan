import { Column, Entity, PrimaryGeneratedColumn, BaseEntity } from "typeorm";

@Entity('QCGabah')
export class QCGabah extends BaseEntity {
    @Column({
        type: 'bigint',
        nullable: false,
    })
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({
        type: 'varchar',
        nullable: true,
        length: 255,
    })
    supplier?: string;

    @Column({
        type: 'varchar',
        nullable: true,
        length: 50,
    })
    lot?: string;

    @Column({
        type: 'text',
        nullable: false,
    })
    image_url!: string;

    @Column({
        type: 'decimal',
        nullable: false,
        precision: 5,
        scale: 2,
    })
    green_percentage!: number;

    @Column({
        type: 'varchar',
        nullable: false,
        length: 20,
    })
    grade!: string;

    @Column({
        type: 'int',
        nullable: false,
        default: 1
    })
    level!: number;

    @Column({
        type: 'varchar',
        nullable: false,
        length: 20,
    })
    status!: string; // OK | WARNING | REJECT

    @Column({
        type: 'timestamp',
        nullable: false,
        default: () => "NOW()",
    })
    created_at!: Date;
}
