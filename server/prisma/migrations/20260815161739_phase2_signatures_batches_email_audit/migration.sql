-- CreateEnum
CREATE TYPE "batch_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "certificate_email_status" AS ENUM ('NOT_SENT', 'SENT', 'FAILED', 'OPENED', 'CLICKED', 'BOUNCED');

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "batch_id" TEXT,
ADD COLUMN     "email_error" TEXT,
ADD COLUMN     "email_message_id" TEXT,
ADD COLUMN     "email_sent_at" TIMESTAMP(3),
ADD COLUMN     "email_status" "certificate_email_status" NOT NULL DEFAULT 'NOT_SENT';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_reset_expires_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_token_hash" TEXT;

-- CreateTable
CREATE TABLE "signatures" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_batches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "batch_status" NOT NULL DEFAULT 'PENDING',
    "requested_count" INTEGER NOT NULL,
    "generated_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "certificate_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signatures_organization_id_idx" ON "signatures"("organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "certificate_batches_event_id_idx" ON "certificate_batches"("event_id");

-- CreateIndex
CREATE INDEX "certificates_batch_id_idx" ON "certificates"("batch_id");

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_batches" ADD CONSTRAINT "certificate_batches_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "certificate_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
