/*
  Warnings:

  - A unique constraint covering the columns `[yahooId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[outlookId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ReturnRequest" ALTER COLUMN "photos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "outlookId" TEXT,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "yahooId" TEXT;

-- CreateTable
CREATE TABLE "PhoneOtp" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'login',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneOtp_phone_idx" ON "PhoneOtp"("phone");

-- CreateIndex
CREATE INDEX "PhoneOtp_expiresAt_idx" ON "PhoneOtp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_yahooId_key" ON "User"("yahooId");

-- CreateIndex
CREATE UNIQUE INDEX "User_outlookId_key" ON "User"("outlookId");
