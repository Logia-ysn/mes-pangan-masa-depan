import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLevelToQualityParameter1769609900000 implements MigrationInterface {
    name = 'AddLevelToQualityParameter1769609900000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "QualityParameter" ADD "level" integer NOT NULL DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "QualityParameter" DROP COLUMN "level"`);
    }
}
