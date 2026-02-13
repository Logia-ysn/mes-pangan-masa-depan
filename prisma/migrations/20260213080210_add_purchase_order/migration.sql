-- CreateEnum
CREATE TYPE "PurchaseOrder_status_enum" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" SERIAL NOT NULL,
    "id_factory" INTEGER NOT NULL,
    "id_supplier" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "po_number" VARCHAR(50) NOT NULL,
    "order_date" DATE NOT NULL,
    "expected_date" DATE,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "PurchaseOrder_status_enum" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" SERIAL NOT NULL,
    "id_purchase_order" INTEGER NOT NULL,
    "id_product_type" INTEGER NOT NULL,
    "quantity" DECIMAL(15,2) NOT NULL,
    "received_quantity" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" SERIAL NOT NULL,
    "id_purchase_order" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "receipt_number" VARCHAR(50) NOT NULL,
    "receipt_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" SERIAL NOT NULL,
    "id_goods_receipt" INTEGER NOT NULL,
    "id_purchase_order_item" INTEGER NOT NULL,
    "quantity_received" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_po_number_key" ON "PurchaseOrder"("po_number");

-- CreateIndex
CREATE INDEX "PurchaseOrder_id_factory_idx" ON "PurchaseOrder"("id_factory");

-- CreateIndex
CREATE INDEX "PurchaseOrder_id_supplier_idx" ON "PurchaseOrder"("id_supplier");

-- CreateIndex
CREATE INDEX "PurchaseOrder_order_date_idx" ON "PurchaseOrder"("order_date");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_receipt_number_key" ON "GoodsReceipt"("receipt_number");

-- CreateIndex
CREATE INDEX "GoodsReceipt_id_purchase_order_idx" ON "GoodsReceipt"("id_purchase_order");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_id_factory_fkey" FOREIGN KEY ("id_factory") REFERENCES "Factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_id_supplier_fkey" FOREIGN KEY ("id_supplier") REFERENCES "Supplier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "PurchaseOrder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_id_product_type_fkey" FOREIGN KEY ("id_product_type") REFERENCES "ProductType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_id_purchase_order_fkey" FOREIGN KEY ("id_purchase_order") REFERENCES "PurchaseOrder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_id_goods_receipt_fkey" FOREIGN KEY ("id_goods_receipt") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_id_purchase_order_item_fkey" FOREIGN KEY ("id_purchase_order_item") REFERENCES "PurchaseOrderItem"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
