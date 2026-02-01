import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupplierTable1768759082942 implements MigrationInterface {
    name = 'AddSupplierTable1768759082942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Supplier" ("id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(200) NOT NULL, "contact_person" character varying(200), "phone" character varying(20), "email" character varying(100), "address" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_5157c34d0b321d8dac46c19a021" UNIQUE ("code"), CONSTRAINT "PK_03ea59de9d1ab05d7d6e5d3e953" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "Supplier"`);
    }

}
