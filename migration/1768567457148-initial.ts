import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1768567457148 implements MigrationInterface {
    name = 'Initial1768567457148'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Factory" ("id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(200) NOT NULL, "address" text, "phone" character varying(20), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_6635a0ad5ed4a0499652a126970" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."User_role_enum" AS ENUM('ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR')`);
        await queryRunner.query(`CREATE TABLE "User" ("id" SERIAL NOT NULL, "email" character varying(100) NOT NULL, "password_hash" character varying(255) NOT NULL, "fullname" character varying(200) NOT NULL, "role" "public"."User_role_enum" NOT NULL DEFAULT 'OPERATOR', "id_factory" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_9862f679340fb2388436a5ab3e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Worksheet_shift_enum" AS ENUM('SHIFT_1', 'SHIFT_2', 'SHIFT_3')`);
        await queryRunner.query(`CREATE TABLE "Worksheet" ("id" SERIAL NOT NULL, "id_factory" integer NOT NULL, "id_user" integer NOT NULL, "worksheet_date" date NOT NULL, "shift" "public"."Worksheet_shift_enum" NOT NULL, "gabah_input" numeric(15,2) NOT NULL, "beras_output" numeric(15,2) NOT NULL, "menir_output" numeric(15,2) NOT NULL DEFAULT '0', "dedak_output" numeric(15,2) NOT NULL DEFAULT '0', "sekam_output" numeric(15,2) NOT NULL DEFAULT '0', "rendemen" numeric(5,2), "machine_hours" numeric(5,2) NOT NULL DEFAULT '0', "downtime_hours" numeric(5,2) NOT NULL DEFAULT '0', "downtime_reason" text, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_dd3c48d621cab0deaa8b38f417e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ProductType" ("id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "unit" character varying(20) NOT NULL DEFAULT 'kg', CONSTRAINT "PK_242e6bc43c0297318eb8560618f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Customer" ("id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(200) NOT NULL, "contact_person" character varying(200), "phone" character varying(20), "email" character varying(100), "address" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_60596e16740e1fa20dbf0154ec7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Invoice_status_enum" AS ENUM('DRAFT', 'SENT', 'PAID', 'PARTIAL', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "Invoice" ("id" SERIAL NOT NULL, "id_factory" integer NOT NULL, "id_customer" integer NOT NULL, "id_user" integer NOT NULL, "invoice_number" character varying(50) NOT NULL, "invoice_date" date NOT NULL, "due_date" date NOT NULL, "subtotal" numeric(15,2) NOT NULL DEFAULT '0', "tax" numeric(15,2) NOT NULL DEFAULT '0', "discount" numeric(15,2) NOT NULL DEFAULT '0', "total" numeric(15,2) NOT NULL DEFAULT '0', "status" "public"."Invoice_status_enum" NOT NULL DEFAULT 'DRAFT', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_0ead03cb5a20e5a5cc4d6defbe6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Payment_payment_method_enum" AS ENUM('CASH', 'TRANSFER', 'CHECK', 'GIRO')`);
        await queryRunner.query(`CREATE TABLE "Payment" ("id" SERIAL NOT NULL, "id_invoice" integer NOT NULL, "id_user" integer NOT NULL, "payment_date" date NOT NULL, "amount" numeric(15,2) NOT NULL, "payment_method" "public"."Payment_payment_method_enum" NOT NULL, "reference_number" character varying(100), "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_07e9fb9a8751923eb876d57a575" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Machine_status_enum" AS ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE')`);
        await queryRunner.query(`CREATE TABLE "Machine" ("id" SERIAL NOT NULL, "id_factory" integer NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(200) NOT NULL, "machine_type" character varying(100), "capacity_per_hour" numeric(10,2), "status" "public"."Machine_status_enum" NOT NULL DEFAULT 'ACTIVE', "last_maintenance_date" date, "next_maintenance_date" date, CONSTRAINT "PK_575ee17453f39be625e174d7a1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Maintenance_maintenance_type_enum" AS ENUM('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY')`);
        await queryRunner.query(`CREATE TABLE "Maintenance" ("id" SERIAL NOT NULL, "id_machine" integer NOT NULL, "id_user" integer NOT NULL, "maintenance_type" "public"."Maintenance_maintenance_type_enum" NOT NULL, "maintenance_date" date NOT NULL, "cost" numeric(15,2) NOT NULL DEFAULT '0', "description" text, "parts_replaced" text, "next_maintenance_date" date, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_29c5e2995d22e714bc782e0dabc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "Stock" ("id" SERIAL NOT NULL, "id_factory" integer NOT NULL, "id_product_type" integer NOT NULL, "quantity" numeric(15,2) NOT NULL DEFAULT '0', "unit" character varying(20) NOT NULL DEFAULT 'kg', "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_2725537b7bbe40073a50986598d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."StockMovement_movement_type_enum" AS ENUM('IN', 'OUT', 'ADJUSTMENT')`);
        await queryRunner.query(`CREATE TABLE "StockMovement" ("id" SERIAL NOT NULL, "id_stock" integer NOT NULL, "id_user" integer NOT NULL, "movement_type" "public"."StockMovement_movement_type_enum" NOT NULL, "quantity" numeric(15,2) NOT NULL, "reference_type" character varying(50), "reference_id" bigint, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_89f737b966ba80fd8227b51fe01" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "InvoiceItem" ("id" SERIAL NOT NULL, "id_invoice" integer NOT NULL, "id_product_type" integer NOT NULL, "quantity" numeric(15,2) NOT NULL, "unit_price" numeric(15,2) NOT NULL, "subtotal" numeric(15,2) NOT NULL, CONSTRAINT "PK_fe59f574f9f138df4b52fb7ee7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ExpenseCategory" ("id" SERIAL NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(100) NOT NULL, "description" text, CONSTRAINT "PK_a9db04a82eebfc29ba6bca6e8a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Employee_gender_enum" AS ENUM('MALE', 'FEMALE')`);
        await queryRunner.query(`CREATE TYPE "public"."Employee_employment_status_enum" AS ENUM('PERMANENT', 'CONTRACT', 'DAILY', 'INTERN')`);
        await queryRunner.query(`CREATE TABLE "Employee" ("id" SERIAL NOT NULL, "id_factory" integer NOT NULL, "id_user" integer, "employee_code" character varying(20) NOT NULL, "fullname" character varying(200) NOT NULL, "nik" character varying(16), "phone" character varying(20), "email" character varying(100), "address" text, "birth_date" date, "birth_place" character varying(100), "gender" "public"."Employee_gender_enum" NOT NULL, "religion" character varying(50), "marital_status" character varying(50), "position" character varying(100) NOT NULL, "department" character varying(100), "join_date" date NOT NULL, "employment_status" "public"."Employee_employment_status_enum" NOT NULL DEFAULT 'PERMANENT', "salary" numeric(15,2), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_9a993c20751b9867abc60108433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "DailyExpense" ("id" SERIAL NOT NULL, "id_factory" integer NOT NULL, "id_user" integer NOT NULL, "id_expense_category" integer NOT NULL, "expense_date" date NOT NULL, "amount" numeric(15,2) NOT NULL, "description" text NOT NULL, "receipt_url" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_06292ff0a9a26203660b736a205" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Attendance_status_enum" AS ENUM('PRESENT', 'ABSENT', 'SICK', 'LEAVE', 'PERMISSION')`);
        await queryRunner.query(`CREATE TABLE "Attendance" ("id" SERIAL NOT NULL, "id_employee" integer NOT NULL, "id_user" integer NOT NULL, "attendance_date" date NOT NULL, "check_in_time" TIME, "check_out_time" TIME, "status" "public"."Attendance_status_enum" NOT NULL DEFAULT 'PRESENT', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT "PK_137a8eec2cec8606cdf8f1e4f67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "User" ADD CONSTRAINT "FK_488e9d8940dc65f34cdf82d750f" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD CONSTRAINT "FK_b6e3fcc79a8ed4484be3f3d8eeb" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Worksheet" ADD CONSTRAINT "FK_4389afefb4c0bbc4fc7a1a435f3" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Invoice" ADD CONSTRAINT "FK_327b5e6c32a7ad18d1558f33171" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Invoice" ADD CONSTRAINT "FK_34be43b2cfd1fcc9838743ff67f" FOREIGN KEY ("id_customer") REFERENCES "Customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Invoice" ADD CONSTRAINT "FK_019719e73446b44c79a559fa2ed" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Payment" ADD CONSTRAINT "FK_718e9dbbccb3bfd36ae3e8cd5c2" FOREIGN KEY ("id_invoice") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Payment" ADD CONSTRAINT "FK_449e7a6f2e2359ffbb8746d11e8" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Machine" ADD CONSTRAINT "FK_b8a0fe79ae166740619fce48848" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Maintenance" ADD CONSTRAINT "FK_56a2aeb1c341080930b90cccfb6" FOREIGN KEY ("id_machine") REFERENCES "Machine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Maintenance" ADD CONSTRAINT "FK_b286f77b3a913862b7ed2e97415" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Stock" ADD CONSTRAINT "FK_1e850f690899d16194616041127" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Stock" ADD CONSTRAINT "FK_c976f3986f53fb7ace248099810" FOREIGN KEY ("id_product_type") REFERENCES "ProductType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "StockMovement" ADD CONSTRAINT "FK_03c884464cad073305dd53ed7b1" FOREIGN KEY ("id_stock") REFERENCES "Stock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "StockMovement" ADD CONSTRAINT "FK_0645774788e95617e3ffd45b3b7" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "InvoiceItem" ADD CONSTRAINT "FK_bd5cd6fccadcc384a73f93c3c89" FOREIGN KEY ("id_invoice") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "InvoiceItem" ADD CONSTRAINT "FK_c3c3c7442a541e37357ff4b2328" FOREIGN KEY ("id_product_type") REFERENCES "ProductType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Employee" ADD CONSTRAINT "FK_6fb1f08d2181fcb9ecfc6e8dbd7" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Employee" ADD CONSTRAINT "FK_92445038f4236e0b2109a4ee29f" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "DailyExpense" ADD CONSTRAINT "FK_8fb9155586106a11a7065f2fcc4" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "DailyExpense" ADD CONSTRAINT "FK_fd6f8ee06f6ae2671e585929d5b" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "DailyExpense" ADD CONSTRAINT "FK_0c3ada66474c1cf9dbd04f29c01" FOREIGN KEY ("id_expense_category") REFERENCES "ExpenseCategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Attendance" ADD CONSTRAINT "FK_e6ea1421dce673712ff1e5e5cb1" FOREIGN KEY ("id_employee") REFERENCES "Employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Attendance" ADD CONSTRAINT "FK_d924a0306d869e3c96a1617247b" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Attendance" DROP CONSTRAINT "FK_d924a0306d869e3c96a1617247b"`);
        await queryRunner.query(`ALTER TABLE "Attendance" DROP CONSTRAINT "FK_e6ea1421dce673712ff1e5e5cb1"`);
        await queryRunner.query(`ALTER TABLE "DailyExpense" DROP CONSTRAINT "FK_0c3ada66474c1cf9dbd04f29c01"`);
        await queryRunner.query(`ALTER TABLE "DailyExpense" DROP CONSTRAINT "FK_fd6f8ee06f6ae2671e585929d5b"`);
        await queryRunner.query(`ALTER TABLE "DailyExpense" DROP CONSTRAINT "FK_8fb9155586106a11a7065f2fcc4"`);
        await queryRunner.query(`ALTER TABLE "Employee" DROP CONSTRAINT "FK_92445038f4236e0b2109a4ee29f"`);
        await queryRunner.query(`ALTER TABLE "Employee" DROP CONSTRAINT "FK_6fb1f08d2181fcb9ecfc6e8dbd7"`);
        await queryRunner.query(`ALTER TABLE "InvoiceItem" DROP CONSTRAINT "FK_c3c3c7442a541e37357ff4b2328"`);
        await queryRunner.query(`ALTER TABLE "InvoiceItem" DROP CONSTRAINT "FK_bd5cd6fccadcc384a73f93c3c89"`);
        await queryRunner.query(`ALTER TABLE "StockMovement" DROP CONSTRAINT "FK_0645774788e95617e3ffd45b3b7"`);
        await queryRunner.query(`ALTER TABLE "StockMovement" DROP CONSTRAINT "FK_03c884464cad073305dd53ed7b1"`);
        await queryRunner.query(`ALTER TABLE "Stock" DROP CONSTRAINT "FK_c976f3986f53fb7ace248099810"`);
        await queryRunner.query(`ALTER TABLE "Stock" DROP CONSTRAINT "FK_1e850f690899d16194616041127"`);
        await queryRunner.query(`ALTER TABLE "Maintenance" DROP CONSTRAINT "FK_b286f77b3a913862b7ed2e97415"`);
        await queryRunner.query(`ALTER TABLE "Maintenance" DROP CONSTRAINT "FK_56a2aeb1c341080930b90cccfb6"`);
        await queryRunner.query(`ALTER TABLE "Machine" DROP CONSTRAINT "FK_b8a0fe79ae166740619fce48848"`);
        await queryRunner.query(`ALTER TABLE "Payment" DROP CONSTRAINT "FK_449e7a6f2e2359ffbb8746d11e8"`);
        await queryRunner.query(`ALTER TABLE "Payment" DROP CONSTRAINT "FK_718e9dbbccb3bfd36ae3e8cd5c2"`);
        await queryRunner.query(`ALTER TABLE "Invoice" DROP CONSTRAINT "FK_019719e73446b44c79a559fa2ed"`);
        await queryRunner.query(`ALTER TABLE "Invoice" DROP CONSTRAINT "FK_34be43b2cfd1fcc9838743ff67f"`);
        await queryRunner.query(`ALTER TABLE "Invoice" DROP CONSTRAINT "FK_327b5e6c32a7ad18d1558f33171"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP CONSTRAINT "FK_4389afefb4c0bbc4fc7a1a435f3"`);
        await queryRunner.query(`ALTER TABLE "Worksheet" DROP CONSTRAINT "FK_b6e3fcc79a8ed4484be3f3d8eeb"`);
        await queryRunner.query(`ALTER TABLE "User" DROP CONSTRAINT "FK_488e9d8940dc65f34cdf82d750f"`);
        await queryRunner.query(`DROP TABLE "Attendance"`);
        await queryRunner.query(`DROP TYPE "public"."Attendance_status_enum"`);
        await queryRunner.query(`DROP TABLE "DailyExpense"`);
        await queryRunner.query(`DROP TABLE "Employee"`);
        await queryRunner.query(`DROP TYPE "public"."Employee_employment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."Employee_gender_enum"`);
        await queryRunner.query(`DROP TABLE "ExpenseCategory"`);
        await queryRunner.query(`DROP TABLE "InvoiceItem"`);
        await queryRunner.query(`DROP TABLE "StockMovement"`);
        await queryRunner.query(`DROP TYPE "public"."StockMovement_movement_type_enum"`);
        await queryRunner.query(`DROP TABLE "Stock"`);
        await queryRunner.query(`DROP TABLE "Maintenance"`);
        await queryRunner.query(`DROP TYPE "public"."Maintenance_maintenance_type_enum"`);
        await queryRunner.query(`DROP TABLE "Machine"`);
        await queryRunner.query(`DROP TYPE "public"."Machine_status_enum"`);
        await queryRunner.query(`DROP TABLE "Payment"`);
        await queryRunner.query(`DROP TYPE "public"."Payment_payment_method_enum"`);
        await queryRunner.query(`DROP TABLE "Invoice"`);
        await queryRunner.query(`DROP TYPE "public"."Invoice_status_enum"`);
        await queryRunner.query(`DROP TABLE "Customer"`);
        await queryRunner.query(`DROP TABLE "ProductType"`);
        await queryRunner.query(`DROP TABLE "Worksheet"`);
        await queryRunner.query(`DROP TYPE "public"."Worksheet_shift_enum"`);
        await queryRunner.query(`DROP TABLE "User"`);
        await queryRunner.query(`DROP TYPE "public"."User_role_enum"`);
        await queryRunner.query(`DROP TABLE "Factory"`);
    }

}
