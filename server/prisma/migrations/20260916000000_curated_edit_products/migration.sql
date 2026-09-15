-- Lets a curated edit ("Founder's picks" etc.) feature specific products
-- directly, instead of only linking somewhere else.
ALTER TABLE "CuratedEdit" ADD COLUMN "productIds" TEXT[] NOT NULL DEFAULT '{}';
