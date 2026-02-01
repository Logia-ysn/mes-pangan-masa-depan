import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { StockMovement } from '../table/StockMovement';

@Entity('RawMaterialQualityAnalysis')
export class RawMaterialQualityAnalysis extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column({ type: 'varchar', length: 50, nullable: false })
    batch_id!: string;

    // Optional link to actual stock movement receipt
    @ManyToOne(() => StockMovement, { nullable: true })
    @JoinColumn({ name: 'id_stock_movement' })
    otm_id_stock_movement?: StockMovement;

    @Column({ name: 'id_stock_movement', type: 'bigint', nullable: true })
    id_stock_movement?: number;

    @Column({ type: 'date', default: () => 'CURRENT_DATE' })
    analysis_date!: Date;

    // Moisture Result
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    moisture_value?: number;

    @Column({ type: 'varchar', length: 20, nullable: true })
    moisture_grade?: string;

    // Density Result
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    density_value?: number;

    @Column({ type: 'varchar', length: 20, nullable: true })
    density_grade?: string;

    // Color Result
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    green_percentage?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    yellow_percentage?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    red_percentage?: number;

    @Column({ type: 'varchar', length: 20, nullable: true })
    color_grade?: string;

    @Column({ type: 'text', nullable: true })
    image_url?: string;

    // Final Result
    @Column({ type: 'varchar', length: 20, nullable: true })
    final_grade?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
