import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddQualityParameterTable1769414307000 implements MigrationInterface {
    name = 'AddQualityParameterTable1769414307000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create QualityParameter table
        await queryRunner.createTable(
            new Table({
                name: "QualityParameter",
                columns: [
                    {
                        name: "id",
                        type: "bigint",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "name",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "id_variety",
                        type: "bigint",
                        isNullable: true
                    },
                    {
                        name: "grade",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "min_value",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: true
                    },
                    {
                        name: "max_value",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: true
                    },
                    {
                        name: "unit",
                        type: "varchar",
                        default: "'percentage'"
                    },
                    {
                        name: "is_active",
                        type: "boolean",
                        default: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP"
                    }
                ]
            }),
            true
        );

        // Add foreign key to RawMaterialVariety
        await queryRunner.createForeignKey(
            "QualityParameter",
            new TableForeignKey({
                columnNames: ["id_variety"],
                referencedColumnNames: ["id"],
                referencedTableName: "RawMaterialVariety",
                onDelete: "SET NULL"
            })
        );

        // Create RawMaterialQualityAnalysis table if it doesn't exist
        const hasAnalysisTable = await queryRunner.hasTable("RawMaterialQualityAnalysis");
        if (!hasAnalysisTable) {
            await queryRunner.createTable(
                new Table({
                    name: "RawMaterialQualityAnalysis",
                    columns: [
                        {
                            name: "id",
                            type: "bigint",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment"
                        },
                        {
                            name: "batch_id",
                            type: "varchar",
                            isNullable: false
                        },
                        {
                            name: "id_stock_movement",
                            type: "bigint",
                            isNullable: true
                        },
                        {
                            name: "moisture_value",
                            type: "decimal",
                            precision: 10,
                            scale: 2,
                            isNullable: true
                        },
                        {
                            name: "density_value",
                            type: "decimal",
                            precision: 10,
                            scale: 2,
                            isNullable: true
                        },
                        {
                            name: "green_percentage",
                            type: "decimal",
                            precision: 5,
                            scale: 2,
                            isNullable: true
                        },
                        {
                            name: "yellow_percentage",
                            type: "decimal",
                            precision: 5,
                            scale: 2,
                            isNullable: true
                        },
                        {
                            name: "final_grade",
                            type: "varchar",
                            isNullable: true
                        },
                        {
                            name: "notes",
                            type: "text",
                            isNullable: true
                        },
                        {
                            name: "analyzed_by",
                            type: "bigint",
                            isNullable: true
                        },
                        {
                            name: "analyzed_at",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP"
                        },
                        {
                            name: "created_at",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP"
                        },
                        {
                            name: "updated_at",
                            type: "timestamp",
                            default: "CURRENT_TIMESTAMP",
                            onUpdate: "CURRENT_TIMESTAMP"
                        }
                    ]
                }),
                true
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("RawMaterialQualityAnalysis", true);
        await queryRunner.dropTable("QualityParameter", true);
    }
}
