import { MigrationInterface, QueryRunner } from "typeorm";

export class WorksheetEnhancement1769029648273 implements MigrationInterface {
    name = 'WorksheetEnhancement1769029648273'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "OutputProduct" ("id" SERIAL NOT NULL, "id_factory" integer NOT NULL, "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "display_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_e3c20634774dc24c518a507ad93" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "WorksheetSideProduct" ("id" SERIAL NOT NULL, "id_worksheet" integer NOT NULL, "product_code" character varying(30) NOT NULL, "product_name" character varying(100) NOT NULL, "quantity" numeric(15,2) NOT NULL DEFAULT '0', "is_auto_calculated" boolean NOT NULL DEFAULT false, "auto_percentage" numeric(10,2), "unit_price" numeric(15,2), "total_value" numeric(15,2), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_d28ee5b7917b61e88f9332d692a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "WorksheetInputBatch" ("id" SERIAL NOT NULL, "id_worksheet" integer NOT NULL, "id_stock" integer NOT NULL, "batch_code" character varying(50), "quantity" numeric(15,2) NOT NULL, "unit_price" numeric(15,2), "total_cost" numeric(15,2), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_cbcc8c68a536ba6b5eeb90f18ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ProcessCategory" ("id" SERIAL NOT NULL, "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "is_main_process" boolean NOT NULL DEFAULT true, "display_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_f537bc87f07860fee454dec2de0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "id_output_product" integer`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "batch_code" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "process_steps" text`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "raw_material_cost" numeric(15,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "side_product_revenue" numeric(15,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "hpp" numeric(15,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "hpp_per_kg" numeric(15,2)`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "id_process_category" integer`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ALTER COLUMN "production_cost" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "OutputProduct" ADD CONSTRAINT "FK_032c651db48b9984eba12043150" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD CONSTRAINT "FK_10ff9fd85814d58f9a6d74a5a7e" FOREIGN KEY ("id_output_product") REFERENCES "OutputProduct"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "WorksheetSideProduct" ADD CONSTRAINT "FK_da2240b0153fe85db8486b2fbdb" FOREIGN KEY ("id_worksheet") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "WorksheetInputBatch" ADD CONSTRAINT "FK_e0d88499487a68a02f8b06f91c2" FOREIGN KEY ("id_worksheet") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "WorksheetInputBatch" ADD CONSTRAINT "FK_83e28cc5e280f92c5d0b7a1c09b" FOREIGN KEY ("id_stock") REFERENCES "Stock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD CONSTRAINT "FK_0bd16b6d607a59b82a09b2fc0f2" FOREIGN KEY ("id_process_category") REFERENCES "ProcessCategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Machine" DROP CONSTRAINT "FK_0bd16b6d607a59b82a09b2fc0f2"`);
        await queryRunner.query(`ALTER TABLE "WorksheetInputBatch" DROP CONSTRAINT "FK_83e28cc5e280f92c5d0b7a1c09b"`);
        await queryRunner.query(`ALTER TABLE "WorksheetInputBatch" DROP CONSTRAINT "FK_e0d88499487a68a02f8b06f91c2"`);
        await queryRunner.query(`ALTER TABLE "WorksheetSideProduct" DROP CONSTRAINT "FK_da2240b0153fe85db8486b2fbdb"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP CONSTRAINT "FK_10ff9fd85814d58f9a6d74a5a7e"`);
        await queryRunner.query(`ALTER TABLE "OutputProduct" DROP CONSTRAINT "FK_032c651db48b9984eba12043150"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ALTER COLUMN "production_cost" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "id_process_category"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "hpp_per_kg"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "hpp"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "side_product_revenue"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "raw_material_cost"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "process_steps"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "batch_code"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "id_output_product"`);
        await queryRunner.query(`DROP TABLE "ProcessCategory"`);
        await queryRunner.query(`DROP TABLE "WorksheetInputBatch"`);
        await queryRunner.query(`DROP TABLE "WorksheetSideProduct"`);
        await queryRunner.query(`DROP TABLE "OutputProduct"`);
    }

}
