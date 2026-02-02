import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperuserRole1770015778485 implements MigrationInterface {
    name = 'AddSuperuserRole1770015778485'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."User_role_enum" RENAME TO "User_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."User_role_enum" AS ENUM('SUPERUSER', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR')`);
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "role" TYPE "public"."User_role_enum" USING "role"::"text"::"public"."User_role_enum"`);
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATOR'`);
        await queryRunner.query(`DROP TYPE "public"."User_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."User_role_enum_old" AS ENUM('ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR')`);
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "role" TYPE "public"."User_role_enum_old" USING "role"::"text"::"public"."User_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATOR'`);
        await queryRunner.query(`DROP TYPE "public"."User_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."User_role_enum_old" RENAME TO "User_role_enum"`);
    }

}
