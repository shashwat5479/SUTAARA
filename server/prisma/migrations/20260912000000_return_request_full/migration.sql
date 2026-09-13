-- Full return/refund request model with photo evidence and Razorpay refund tracking

CREATE TYPE "ReturnCategory" AS ENUM ('wrong_item', 'damaged', 'quality_issue', 'size_issue', 'not_as_described', 'other');
CREATE TYPE "ReturnRequestStatus" AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'refund_initiated', 'refund_settled');

CREATE TABLE "ReturnRequest" (
  "id"                TEXT NOT NULL,
  "orderId"           TEXT NOT NULL,
  "reason"            TEXT NOT NULL,
  "category"          "ReturnCategory" NOT NULL DEFAULT 'other',
  "photos"            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "description"       TEXT,
  "status"            "ReturnRequestStatus" NOT NULL DEFAULT 'submitted',
  "adminNote"         TEXT,
  "rejectedReason"    TEXT,
  "refundId"          TEXT,
  "refundStatus"      TEXT,
  "refundAmount"      INTEGER,
  "refundInitiatedAt" TIMESTAMP(3),
  "refundSettledAt"   TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReturnRequest_orderId_key" ON "ReturnRequest"("orderId");
CREATE INDEX "ReturnRequest_orderId_idx" ON "ReturnRequest"("orderId");

ALTER TABLE "ReturnRequest"
  ADD CONSTRAINT "ReturnRequest_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
