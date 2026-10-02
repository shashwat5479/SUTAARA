-- AlterTable: blouse / bag dimensions shown under Product Details
ALTER TABLE "Product" ADD COLUMN "dimensions" TEXT NOT NULL DEFAULT '';
