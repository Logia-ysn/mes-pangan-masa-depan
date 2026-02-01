import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLevelToQCGabah1769811579451 implements MigrationInterface {
    name = 'AddLevelToQCGabah1769811579451'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP CONSTRAINT "FK_046d2225de7a7bedcdf0ca626e8"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "analyzed_by"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "analyzed_at"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "analysis_date" date NOT NULL DEFAULT ('now'::text)::date`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "moisture_grade" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "density_grade" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "red_percentage" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "color_grade" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "image_url" text`);
        await queryRunner.query(`ALTER TABLE "QCGabah" ADD "level" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP CONSTRAINT "PK_360eda0c8661d53b9df013fa43b"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD CONSTRAINT "PK_360eda0c8661d53b9df013fa43b" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "batch_id"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "batch_id" character varying(50) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "id_stock_movement"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "id_stock_movement" integer`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ALTER COLUMN "green_percentage" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ALTER COLUMN "yellow_percentage" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "final_grade"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "final_grade" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP CONSTRAINT "PK_5d5fdce6fef66d219e1d69d07d7"`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD CONSTRAINT "PK_5d5fdce6fef66d219e1d69d07d7" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP COLUMN "id_variety"`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD "id_variety" integer`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "QCGabah" DROP CONSTRAINT "PK_QCGabah_id"`);
        await queryRunner.query(`ALTER TABLE "QCGabah" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "QCGabah" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "QCGabah" ADD CONSTRAINT "PK_25e23bf8af8a9efcee9f4b1f1cd" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD CONSTRAINT "FK_3d06912136df7e15154257cc8f3" FOREIGN KEY ("id_stock_movement") REFERENCES "StockMovement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD CONSTRAINT "FK_046d2225de7a7bedcdf0ca626e8" FOREIGN KEY ("id_variety") REFERENCES "RawMaterialVariety"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP CONSTRAINT "FK_046d2225de7a7bedcdf0ca626e8"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP CONSTRAINT "FK_3d06912136df7e15154257cc8f3"`);
        await queryRunner.query(`ALTER TABLE "QCGabah" DROP CONSTRAINT "PK_25e23bf8af8a9efcee9f4b1f1cd"`);
        await queryRunner.query(`ALTER TABLE "QCGabah" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "QCGabah" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "QCGabah" ADD CONSTRAINT "PK_QCGabah_id" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP COLUMN "id_variety"`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD "id_variety" bigint`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP CONSTRAINT "PK_5d5fdce6fef66d219e1d69d07d7"`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD CONSTRAINT "PK_5d5fdce6fef66d219e1d69d07d7" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "final_grade"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "final_grade" character varying`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ALTER COLUMN "yellow_percentage" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ALTER COLUMN "green_percentage" TYPE numeric(5,2)`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "id_stock_movement"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "id_stock_movement" bigint`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "batch_id"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "batch_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP CONSTRAINT "PK_360eda0c8661d53b9df013fa43b"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD CONSTRAINT "PK_360eda0c8661d53b9df013fa43b" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "QCGabah" DROP COLUMN "level"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "image_url"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "color_grade"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "red_percentage"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "density_grade"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "moisture_grade"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" DROP COLUMN "analysis_date"`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "analyzed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "RawMaterialQualityAnalysis" ADD "analyzed_by" bigint`);
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD CONSTRAINT "FK_046d2225de7a7bedcdf0ca626e8" FOREIGN KEY ("id_variety") REFERENCES "RawMaterialVariety"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
