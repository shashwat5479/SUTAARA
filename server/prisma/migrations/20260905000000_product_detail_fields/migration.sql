-- AlterTable: add PDF-spec product detail fields
ALTER TABLE "Product" ADD COLUMN "sku" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "sareeLength" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "blousePiece" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Product" ADD COLUMN "stylingNote" TEXT NOT NULL DEFAULT '';
