-- CreateTable
CREATE TABLE "StudioEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Visit the Sutaara Studio',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT 'Lucknow, Uttar Pradesh',
    "address" TEXT NOT NULL DEFAULT '',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "hours" TEXT NOT NULL DEFAULT '11 AM - 7 PM',
    "phone" TEXT NOT NULL DEFAULT '',
    "heroImage" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioEvent_pkey" PRIMARY KEY ("id")
);
