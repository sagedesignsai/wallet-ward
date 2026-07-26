-- AlterTable
ALTER TABLE "integration" ADD COLUMN     "token_expires_at" TIMESTAMP(3),
ADD COLUMN     "last_refreshed_at" TIMESTAMP(3),
ADD COLUMN     "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[];
