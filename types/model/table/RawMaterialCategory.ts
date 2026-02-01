import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, OneToMany } from "typeorm";

@Entity('RawMaterialCategory')
export class RawMaterialCategory extends BaseEntity {
    @Column({
        type: 'bigint',
        nullable: false,
    })
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({
        type: 'varchar',
        nullable: false,
        length: 20,
        unique: true,
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
        default: () => "true",
    })
    is_active!: boolean;

    @Column({
        type: 'timestamp',
        nullable: false,
        default: () => "NOW()",
    })
    created_at!: Date;
}
