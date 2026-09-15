-- Curated Edits shown under "Sutaara Edits" (mega menu + /story page)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE "CuratedEdit" (
  "id"          TEXT NOT NULL,
  "title"       TEXT NOT NULL DEFAULT '',
  "description" TEXT NOT NULL DEFAULT '',
  "image"       TEXT NOT NULL DEFAULT '',
  "link"        TEXT NOT NULL DEFAULT '',
  "order"       INTEGER NOT NULL DEFAULT 0,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CuratedEdit_pkey" PRIMARY KEY ("id")
);

-- Seed the initial set of edits so they appear immediately without the
-- admin needing to type them all in manually. Editable/removable afterward
-- from Admin > Sutaara Edits.
INSERT INTO "CuratedEdit" ("id", "title", "description", "link", "order", "active", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Founder''s picks', 'The pieces we''d reach for first.', '/shop?edit=founders-picks', 0, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Statement Pieces', 'For when you want to be noticed.', '/shop?edit=statement-pieces', 1, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Everyday Sutaara', 'Easy pieces, made for often.', '/shop?edit=everyday-sutaara', 2, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Understated Occasion', 'Quiet pieces that still say something.', '/shop?edit=understated-occasion', 3, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sutaara Favourites', 'The pieces our customers love coming back to.', '/shop?edit=sutaara-favourites', 4, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Sutaara Gifting', 'Curated hampers for weddings, festivities and everything in between — personal, thoughtful and easy to customise.', '/shop?edit=sutaara-gifting', 5, true, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Styling Edit', 'One of Sutaara''s most personal touches — thoughtful styling ideas shaped by a founder with a natural eye for putting a look together.', '/story#styling-edit', 6, true, CURRENT_TIMESTAMP);
