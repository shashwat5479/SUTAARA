-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "alertEmail" TEXT NOT NULL DEFAULT 'shashwat9252@gmail.com',
    "alertWhatsApp" TEXT NOT NULL DEFAULT '9569659272',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);
