-- AlterTable: soft-delete flag for products that have past orders
ALTER TABLE "Product" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
