import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRawMaterialCategoryVariety1768760227067 implements MigrationInterface {
    name = 'AddRawMaterialCategoryVariety1768760227067'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "RawMaterialVariety" ("id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_b2486d09132793df46873cd3df9" UNIQUE ("code"), CONSTRAINT "PK_e6b1cd87e5533fccbed8e7e24b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "RawMaterialCategory" ("id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_a30e2ec13b6a5c7e7ce45a8951f" UNIQUE ("code"), CONSTRAINT "PK_ddf58cf202d3dc204e7bee72ad2" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "RawMaterialCategory"`);
        await queryRunner.query(`DROP TABLE "RawMaterialVariety"`);
    }

}
