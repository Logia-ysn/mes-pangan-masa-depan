import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQCGabah1769760000000 implements MigrationInterface {
    name = 'CreateQCGabah1769760000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "QCGabah" (
            "id" bigserial NOT NULL,
            "supplier" character varying(255),
            "lot" character varying(50),
            "image_url" text NOT NULL,
            "green_percentage" numeric(5,2) NOT NULL,
            "grade" character varying(20) NOT NULL,
            "status" character varying(20) NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_QCGabah_id" PRIMARY KEY ("id")
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "QCGabah"`);
    }
}
