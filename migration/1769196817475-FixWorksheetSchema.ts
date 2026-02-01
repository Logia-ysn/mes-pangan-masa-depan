import { MigrationInterface, QueryRunner } from "typeorm";

export class FixWorksheetSchema1769196817475 implements MigrationInterface {
    name = 'FixWorksheetSchema1769196817475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD "id_machine" integer`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD CONSTRAINT "FK_dddd8317548de410ffa729dc394" FOREIGN KEY ("id_machine") REFERENCES "Machine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP CONSTRAINT "FK_dddd8317548de410ffa729dc394"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP COLUMN "id_machine"`);
    }

}
