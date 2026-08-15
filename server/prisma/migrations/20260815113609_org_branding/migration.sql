-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "address" TEXT,
ADD COLUMN     "brand_color" TEXT,
ADD COLUMN     "certificate_id_prefix" TEXT NOT NULL DEFAULT 'CF',
ADD COLUMN     "phone" TEXT;
