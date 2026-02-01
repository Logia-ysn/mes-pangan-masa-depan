import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { RawMaterialVariety } from '../table/RawMaterialVariety';

@Entity('QualityParameter')
export class QualityParameter extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'varchar', nullable: false })
    name!: string; // e.g., "Moisture Content", "Density"

    @ManyToOne(() => RawMaterialVariety, { nullable: true })
    @JoinColumn({ name: 'id_variety' })
    otm_id_variety?: RawMaterialVariety;

    @Column({ name: 'id_variety', type: 'bigint', nullable: true })
    id_variety?: number;

    @Column({ type: 'varchar', nullable: false })
    grade!: string; // KW 1, KW 2, KW 3

    @Column({ type: 'int', default: 1 })
    level!: number; // 1, 2, 3...

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    min_value?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    max_value?: number;

    @Column({ type: 'varchar', default: 'percentage' })
    unit!: string; // percentage, g/L

    @Column({ type: 'boolean', default: true })
    is_active!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
