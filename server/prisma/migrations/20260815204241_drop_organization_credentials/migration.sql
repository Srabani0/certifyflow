-- DropIndex
DROP INDEX "organizations_email_key";

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "email",
DROP COLUMN "password_hash";
