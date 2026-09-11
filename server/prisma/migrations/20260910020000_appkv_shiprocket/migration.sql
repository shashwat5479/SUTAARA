-- Generic key-value store for server-side persistent state (Shiprocket token cache etc.)
CREATE TABLE "AppKV" (
  "key"       TEXT NOT NULL,
  "value"     TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppKV_pkey" PRIMARY KEY ("key")
);

-- Add Shiprocket shipment ID to Order for label retrieval
ALTER TABLE "Order" ADD COLUMN "shiprocketShipmentId" TEXT;
