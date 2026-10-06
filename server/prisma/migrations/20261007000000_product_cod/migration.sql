-- AlterTable: per-product Cash on Delivery switch. DEFAULT false also sets every existing product to OFF.
ALTER TABLE "Product" ADD COLUMN "codAvailable" BOOLEAN NOT NULL DEFAULT false;
