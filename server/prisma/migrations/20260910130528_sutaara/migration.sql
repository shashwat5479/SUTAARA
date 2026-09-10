/*
  Warnings:

  - You are about to drop the column `alertEmail` on the `NotificationSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NotificationSettings" DROP COLUMN "alertEmail",
ADD COLUMN     "alertEmail1" TEXT NOT NULL DEFAULT 'shashwat9252@gmail.com',
ADD COLUMN     "alertEmail2" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "alertEmail3" TEXT NOT NULL DEFAULT '';
