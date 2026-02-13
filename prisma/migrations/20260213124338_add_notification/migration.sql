-- CreateEnum
CREATE TYPE "Notification_type_enum" AS ENUM ('LOW_STOCK', 'OVERDUE_INVOICE', 'OVERDUE_MAINTENANCE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Notification_severity_enum" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "type" "Notification_type_enum" NOT NULL,
    "severity" "Notification_severity_enum" NOT NULL DEFAULT 'INFO',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "reference_type" VARCHAR(50),
    "reference_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_id_user_is_read_idx" ON "Notification"("id_user", "is_read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
