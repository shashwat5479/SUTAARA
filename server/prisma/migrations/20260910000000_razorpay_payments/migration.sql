-- PaymentStatus enum (order-level payment lifecycle, independent of fulfilment status)
CREATE TYPE "PaymentStatus" AS ENUM ('not_applicable', 'pending', 'paid', 'failed');

-- PaymentAttemptStatus enum (one row per Razorpay attempt)
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('created', 'authorized', 'captured', 'failed');

-- Order: add Razorpay + paymentStatus columns
ALTER TABLE "Order"
  ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'not_applicable',
  ADD COLUMN "razorpayOrderId" TEXT,
  ADD COLUMN "razorpayPaymentId" TEXT,
  ADD COLUMN "razorpaySignature" TEXT;

CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");

-- Backfill: existing online orders that are already paid should read as paid;
-- existing online orders not yet paid should read as pending (not failed —
-- we have no record either way, so don't assume the worst). COD orders stay
-- 'not_applicable' (the column default already covers new rows).
UPDATE "Order" SET "paymentStatus" = 'paid'
  WHERE "paymentMethod" = 'online' AND "isPaid" = true;
UPDATE "Order" SET "paymentStatus" = 'pending'
  WHERE "paymentMethod" = 'online' AND "isPaid" = false;

-- PaymentAttempt table
CREATE TABLE "PaymentAttempt" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "razorpayOrderId" TEXT NOT NULL,
  "razorpayPaymentId" TEXT,
  "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'created',
  "method" TEXT,
  "errorCode" TEXT,
  "errorDescription" TEXT,
  "amount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentAttempt_orderId_idx" ON "PaymentAttempt"("orderId");

ALTER TABLE "PaymentAttempt"
  ADD CONSTRAINT "PaymentAttempt_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
