import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMachineColumns1769027343948 implements MigrationInterface {
    name = 'AddMachineColumns1769027343948'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "input_batch_id" bigint`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "input_category_code" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "process_step" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "production_cost" numeric(15,2)`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "serial_number" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "manufacture_year" integer`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "purchase_date" date`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "vendor_id" integer`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "purchase_price" numeric(15,2)`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "warranty_months" integer`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "created_at" TIMESTAMP NOT NULL DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD CONSTRAINT "FK_970ba71a549e75013ec396472a2" FOREIGN KEY ("vendor_id") REFERENCES "Supplier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Machine" DROP CONSTRAINT "FK_970ba71a549e75013ec396472a2"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "warranty_months"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "purchase_price"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "vendor_id"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "purchase_date"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "manufacture_year"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP COLUMN "serial_number"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "production_cost"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "process_step"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "input_category_code"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "input_batch_id"`);
    }

}
