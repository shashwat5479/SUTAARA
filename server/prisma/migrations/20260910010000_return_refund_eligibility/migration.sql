-- Per-order return/refund eligibility, set by admin/staff. Off by default —
-- existing orders are unaffected until an admin explicitly marks them eligible.
ALTER TABLE "Order" ADD COLUMN "returnEligible" BOOLEAN NOT NULL DEFAULT false;
