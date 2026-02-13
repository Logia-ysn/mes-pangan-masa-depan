-- CreateEnum
CREATE TYPE "Attendance_status_enum" AS ENUM ('PRESENT', 'ABSENT', 'SICK', 'LEAVE', 'PERMISSION');

-- CreateEnum
CREATE TYPE "Employee_employment_status_enum" AS ENUM ('PERMANENT', 'CONTRACT', 'DAILY', 'INTERN');

-- CreateEnum
CREATE TYPE "Employee_gender_enum" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Invoice_status_enum" AS ENUM ('DRAFT', 'SENT', 'PAID', 'PARTIAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Machine_status_enum" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Maintenance_maintenance_type_enum" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "Payment_payment_method_enum" AS ENUM ('CASH', 'TRANSFER', 'CHECK', 'GIRO');

-- CreateEnum
CREATE TYPE "StockMovement_movement_type_enum" AS ENUM ('IN', 'OUT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "User_role_enum" AS ENUM ('SUPERUSER', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'OPERATOR');

-- CreateEnum
CREATE TYPE "Worksheet_shift_enum" AS ENUM ('SHIFT_1', 'SHIFT_2', 'SHIFT_3');

-- CreateTable
CREATE TABLE "Attendance" (
    "id" SERIAL NOT NULL,
    "id_employee" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "attendance_date" DATE NOT NULL,
    "check_in_time" TIME(6),
    "check_out_time" TIME(6),
    "status" "Attendance_status_enum" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_137a8eec2cec8606cdf8f1e4f67" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "contact_person" VARCHAR(200),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_60596e16740e1fa20dbf0154ec7" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyExpense" (
    "id" SERIAL NOT NULL,
    "id_factory" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_expense_category" INTEGER NOT NULL,
    "expense_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" TEXT NOT NULL,
    "receipt_url" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_06292ff0a9a26203660b736a205" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "id_factory" INTEGER NOT NULL,
    "id_user" INTEGER,
    "employee_code" VARCHAR(20) NOT NULL,
    "fullname" VARCHAR(200) NOT NULL,
    "nik" VARCHAR(16),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "birth_date" DATE,
    "birth_place" VARCHAR(100),
    "gender" "Employee_gender_enum" NOT NULL,
    "religion" VARCHAR(50),
    "marital_status" VARCHAR(50),
    "position" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100),
    "join_date" DATE NOT NULL,
    "employment_status" "Employee_employment_status_enum" NOT NULL DEFAULT 'PERMANENT',
    "salary" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_9a993c20751b9867abc60108433" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "PK_a9db04a82eebfc29ba6bca6e8a0" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factory" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_6635a0ad5ed4a0499652a126970" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "id_factory" INTEGER NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "Invoice_status_enum" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_0ead03cb5a20e5a5cc4d6defbe6" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" SERIAL NOT NULL,
    "id_invoice" INTEGER NOT NULL,
    "id_product_type" INTEGER NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "PK_fe59f574f9f138df4b52fb7ee7a" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" SERIAL NOT NULL,
    "id_factory" INTEGER NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "machine_type" VARCHAR(100),
    "capacity_per_hour" DECIMAL(10,2),
    "status" "Machine_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "last_maintenance_date" DATE,
    "next_maintenance_date" DATE,

    CONSTRAINT "PK_575ee17453f39be625e174d7a1f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "id_machine" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "maintenance_type" "Maintenance_maintenance_type_enum" NOT NULL,
    "maintenance_date" DATE NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "parts_replaced" TEXT,
    "next_maintenance_date" DATE,
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_29c5e2995d22e714bc782e0dabc" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutputProduct" (
    "id" SERIAL NOT NULL,
    "id_factory" INTEGER NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_e3c20634774dc24c518a507ad93" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "id_invoice" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "Payment_payment_method_enum" NOT NULL,
    "reference_number" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_07e9fb9a8751923eb876d57a575" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessCategory" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_main_process" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_f537bc87f07860fee454dec2de0" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductType" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'kg',

    CONSTRAINT "PK_242e6bc43c0297318eb8560618f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QCGabah" (
    "supplier" VARCHAR(255),
    "lot" VARCHAR(50),
    "image_url" TEXT NOT NULL,
    "green_percentage" DECIMAL(5,2) NOT NULL,
    "grade" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" INTEGER NOT NULL DEFAULT 1,
    "id" SERIAL NOT NULL,

    CONSTRAINT "PK_25e23bf8af8a9efcee9f4b1f1cd" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityParameter" (
    "name" VARCHAR NOT NULL,
    "grade" VARCHAR NOT NULL,
    "min_value" DECIMAL(10,2),
    "max_value" DECIMAL(10,2),
    "unit" VARCHAR NOT NULL DEFAULT 'percentage',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "id" SERIAL NOT NULL,
    "id_variety" INTEGER,

    CONSTRAINT "PK_5d5fdce6fef66d219e1d69d07d7" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterialCategory" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_ddf58cf202d3dc204e7bee72ad2" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterialQualityAnalysis" (
    "moisture_value" DECIMAL(10,2),
    "density_value" DECIMAL(10,2),
    "green_percentage" DECIMAL(10,2),
    "yellow_percentage" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "analysis_date" DATE NOT NULL DEFAULT ('now'::text)::date,
    "moisture_grade" VARCHAR(20),
    "density_grade" VARCHAR(20),
    "red_percentage" DECIMAL(10,2),
    "color_grade" VARCHAR(20),
    "image_url" TEXT,
    "id" SERIAL NOT NULL,
    "batch_id" VARCHAR(50) NOT NULL,
    "id_stock_movement" INTEGER,
    "final_grade" VARCHAR(20),

    CONSTRAINT "PK_360eda0c8661d53b9df013fa43b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterialVariety" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_e6b1cd87e5533fccbed8e7e24b9" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" SERIAL NOT NULL,
    "id_factory" INTEGER NOT NULL,
    "id_product_type" INTEGER NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unit" VARCHAR(20) NOT NULL DEFAULT 'kg',
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_2725537b7bbe40073a50986598d" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" SERIAL NOT NULL,
    "id_stock" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "movement_type" "StockMovement_movement_type_enum" NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" BIGINT,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_89f737b966ba80fd8227b51fe01" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "contact_person" VARCHAR(200),
    "phone" VARCHAR(20),
    "email" VARCHAR(100),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_03ea59de9d1ab05d7d6e5d3e953" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(200) NOT NULL,
    "role" "User_role_enum" NOT NULL DEFAULT 'OPERATOR',
    "id_factory" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_9862f679340fb2388436a5ab3e4" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worksheet" (
    "id" SERIAL NOT NULL,
    "id_factory" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "worksheet_date" DATE NOT NULL,
    "shift" "Worksheet_shift_enum" NOT NULL,
    "gabah_input" DECIMAL(15,2) NOT NULL,
    "beras_output" DECIMAL(15,2) NOT NULL,
    "menir_output" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dedak_output" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sekam_output" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "rendemen" DECIMAL(5,2),
    "machine_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "downtime_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "downtime_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "id_output_product" INTEGER,
    "id_machine" INTEGER,
    "batch_code" VARCHAR(50),
    "process_step" VARCHAR(50),
    "production_cost" DECIMAL(15,2),
    "raw_material_cost" DECIMAL(15,2),
    "side_product_revenue" DECIMAL(15,2),
    "hpp" DECIMAL(15,2),
    "hpp_per_kg" DECIMAL(15,2),

    CONSTRAINT "PK_dd3c48d621cab0deaa8b38f417e" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorksheetInputBatch" (
    "id" SERIAL NOT NULL,
    "id_worksheet" INTEGER NOT NULL,
    "id_stock" INTEGER NOT NULL,
    "batch_code" VARCHAR(50),
    "quantity" DECIMAL(15,2) NOT NULL,
    "unit_price" DECIMAL(15,2),
    "total_cost" DECIMAL(15,2),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_cbcc8c68a536ba6b5eeb90f18ad" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorksheetSideProduct" (
    "id" SERIAL NOT NULL,
    "id_worksheet" INTEGER NOT NULL,
    "product_code" VARCHAR(30) NOT NULL,
    "product_name" VARCHAR(100) NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_auto_calculated" BOOLEAN NOT NULL DEFAULT false,
    "auto_percentage" DECIMAL(10,2),
    "unit_price" DECIMAL(15,2),
    "total_value" DECIMAL(15,2),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_d28ee5b7917b61e88f9332d692a" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDX_attendance_employee" ON "Attendance"("id_employee");

-- CreateIndex
CREATE INDEX "IDX_attendance_date" ON "Attendance"("attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE INDEX "IDX_daily_expense_factory" ON "DailyExpense"("id_factory");

-- CreateIndex
CREATE INDEX "IDX_daily_expense_user" ON "DailyExpense"("id_user");

-- CreateIndex
CREATE INDEX "IDX_daily_expense_date" ON "DailyExpense"("expense_date");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employee_code_key" ON "Employee"("employee_code");

-- CreateIndex
CREATE INDEX "IDX_employee_factory" ON "Employee"("id_factory");

-- CreateIndex
CREATE INDEX "IDX_employee_user" ON "Employee"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_code_key" ON "ExpenseCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Factory_code_key" ON "Factory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "Invoice"("invoice_number");

-- CreateIndex
CREATE INDEX "IDX_invoice_factory" ON "Invoice"("id_factory");

-- CreateIndex
CREATE INDEX "IDX_invoice_customer" ON "Invoice"("id_customer");

-- CreateIndex
CREATE INDEX "IDX_invoice_date" ON "Invoice"("invoice_date");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_code_key" ON "Machine"("code");

-- CreateIndex
CREATE INDEX "IDX_machine_factory" ON "Machine"("id_factory");

-- CreateIndex
CREATE INDEX "IDX_maintenance_machine" ON "Maintenance"("id_machine");

-- CreateIndex
CREATE INDEX "IDX_maintenance_date" ON "Maintenance"("maintenance_date");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessCategory_code_key" ON "ProcessCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProductType_code_key" ON "ProductType"("code");

-- CreateIndex
CREATE INDEX "IDX_quality_param_variety" ON "QualityParameter"("id_variety");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_a30e2ec13b6a5c7e7ce45a8951f" ON "RawMaterialCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_b2486d09132793df46873cd3df9" ON "RawMaterialVariety"("code");

-- CreateIndex
CREATE INDEX "IDX_stock_factory" ON "Stock"("id_factory");

-- CreateIndex
CREATE INDEX "IDX_stock_product_type" ON "Stock"("id_product_type");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_stock_factory_product" ON "Stock"("id_factory", "id_product_type");

-- CreateIndex
CREATE INDEX "IDX_stock_movement_stock" ON "StockMovement"("id_stock");

-- CreateIndex
CREATE INDEX "IDX_stock_movement_user" ON "StockMovement"("id_user");

-- CreateIndex
CREATE INDEX "IDX_stock_movement_created" ON "StockMovement"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "IDX_worksheet_factory" ON "Worksheet"("id_factory");

-- CreateIndex
CREATE INDEX "IDX_worksheet_user" ON "Worksheet"("id_user");

-- CreateIndex
CREATE INDEX "IDX_worksheet_date" ON "Worksheet"("worksheet_date");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "FK_d924a0306d869e3c96a1617247b" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "FK_e6ea1421dce673712ff1e5e5cb1" FOREIGN KEY ("id_employee") REFERENCES "Employee"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "FK_0c3ada66474c1cf9dbd04f29c01" FOREIGN KEY ("id_expense_category") REFERENCES "ExpenseCategory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "FK_8fb9155586106a11a7065f2fcc4" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DailyExpense" ADD CONSTRAINT "FK_fd6f8ee06f6ae2671e585929d5b" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "FK_6fb1f08d2181fcb9ecfc6e8dbd7" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "FK_92445038f4236e0b2109a4ee29f" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "FK_019719e73446b44c79a559fa2ed" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "FK_327b5e6c32a7ad18d1558f33171" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "FK_34be43b2cfd1fcc9838743ff67f" FOREIGN KEY ("id_customer") REFERENCES "Customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "FK_bd5cd6fccadcc384a73f93c3c89" FOREIGN KEY ("id_invoice") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "FK_c3c3c7442a541e37357ff4b2328" FOREIGN KEY ("id_product_type") REFERENCES "ProductType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "FK_b8a0fe79ae166740619fce48848" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "FK_56a2aeb1c341080930b90cccfb6" FOREIGN KEY ("id_machine") REFERENCES "Machine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "FK_b286f77b3a913862b7ed2e97415" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OutputProduct" ADD CONSTRAINT "FK_032c651db48b9984eba12043150" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "FK_449e7a6f2e2359ffbb8746d11e8" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "FK_718e9dbbccb3bfd36ae3e8cd5c2" FOREIGN KEY ("id_invoice") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QualityParameter" ADD CONSTRAINT "FK_046d2225de7a7bedcdf0ca626e8" FOREIGN KEY ("id_variety") REFERENCES "RawMaterialVariety"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RawMaterialQualityAnalysis" ADD CONSTRAINT "FK_3d06912136df7e15154257cc8f3" FOREIGN KEY ("id_stock_movement") REFERENCES "StockMovement"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "FK_1e850f690899d16194616041127" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "FK_c976f3986f53fb7ace248099810" FOREIGN KEY ("id_product_type") REFERENCES "ProductType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "FK_03c884464cad073305dd53ed7b1" FOREIGN KEY ("id_stock") REFERENCES "Stock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "FK_0645774788e95617e3ffd45b3b7" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "FK_488e9d8940dc65f34cdf82d750f" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "FK_10ff9fd85814d58f9a6d74a5a7e" FOREIGN KEY ("id_output_product") REFERENCES "ProductType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "FK_4389afefb4c0bbc4fc7a1a435f3" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "FK_b6e3fcc79a8ed4484be3f3d8eeb" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "FK_dddd8317548de410ffa729dc394" FOREIGN KEY ("id_machine") REFERENCES "Machine"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorksheetInputBatch" ADD CONSTRAINT "FK_83e28cc5e280f92c5d0b7a1c09b" FOREIGN KEY ("id_stock") REFERENCES "Stock"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorksheetInputBatch" ADD CONSTRAINT "FK_e0d88499487a68a02f8b06f91c2" FOREIGN KEY ("id_worksheet") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "WorksheetSideProduct" ADD CONSTRAINT "FK_da2240b0153fe85db8486b2fbdb" FOREIGN KEY ("id_worksheet") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
