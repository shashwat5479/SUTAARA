-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteVisit_day_visitorId_key" ON "SiteVisit"("day", "visitorId");
CREATE INDEX "SiteVisit_day_idx" ON "SiteVisit"("day");
CREATE INDEX "ProductEvent_productId_type_idx" ON "ProductEvent"("productId", "type");
CREATE INDEX "ProductEvent_type_createdAt_idx" ON "ProductEvent"("type", "createdAt");
