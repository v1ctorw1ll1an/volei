-- O papel ADMIN deixa de existir: quem era ADMIN vira usuário comum
-- (continua dono dos eventos que criou).
UPDATE "User" SET "role" = 'MEMBER' WHERE "role" = 'ADMIN';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SUPERADMIN', 'MEMBER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
COMMIT;

-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "supportWhatsapp" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "whatsapp" TEXT;

-- Modelos passam a ter dono. Os que já existiam ficam com o superadmin mais antigo;
-- sem superadmin, não há a quem atribuir e eles são removidos.
ALTER TABLE "SessionTemplate" ADD COLUMN     "ownerId" TEXT;
UPDATE "SessionTemplate" SET "ownerId" = (
  SELECT "id" FROM "User" WHERE "role" = 'SUPERADMIN' ORDER BY "createdAt" ASC LIMIT 1
);
DELETE FROM "SessionTemplate" WHERE "ownerId" IS NULL;
ALTER TABLE "SessionTemplate" ALTER COLUMN "ownerId" SET NOT NULL;

-- CreateTable
CREATE TABLE "EventBlock" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventBlock_sessionId_userId_key" ON "EventBlock"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "AuthAttempt_key_createdAt_idx" ON "AuthAttempt"("key", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_createdAt_idx" ON "AuthAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "GameSession_createdById_idx" ON "GameSession"("createdById");

-- CreateIndex
CREATE INDEX "SessionTemplate_ownerId_idx" ON "SessionTemplate"("ownerId");

-- CreateIndex
CREATE INDEX "Signup_userId_idx" ON "Signup"("userId");

-- AddForeignKey
ALTER TABLE "SessionTemplate" ADD CONSTRAINT "SessionTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBlock" ADD CONSTRAINT "EventBlock_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBlock" ADD CONSTRAINT "EventBlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
