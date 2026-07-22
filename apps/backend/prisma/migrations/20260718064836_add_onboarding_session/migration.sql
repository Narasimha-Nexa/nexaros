-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "onboarding_statuses" ADD VALUE 'PAYMENT_PENDING';
ALTER TYPE "onboarding_statuses" ADD VALUE 'READY_TO_COMPLETE';
ALTER TYPE "onboarding_statuses" ADD VALUE 'CANCELLED';
ALTER TYPE "onboarding_statuses" ADD VALUE 'EXPIRED';

-- CreateTable
CREATE TABLE "onboarding_sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "onboarding_statuses" NOT NULL DEFAULT 'IN_PROGRESS',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "restaurantName" TEXT NOT NULL,
    "brandName" TEXT,
    "businessType" TEXT,
    "gstNumber" TEXT,
    "fssaiLicense" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'India',
    "postalCode" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Kolkata',
    "currency" TEXT DEFAULT 'INR',
    "restaurantLogo" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerPhone" TEXT,
    "passwordHash" TEXT,
    "taxMode" TEXT,
    "billingPrefs" JSONB,
    "kitchenSettings" JSONB,
    "shiftTimings" JSONB,
    "defaultPrinter" TEXT,
    "language" TEXT DEFAULT 'en',
    "theme" TEXT DEFAULT 'light',
    "dateFormat" TEXT DEFAULT 'DD/MM/YYYY',
    "timeFormat" TEXT DEFAULT '12h',
    "websitePrefs" JSONB,
    "planId" TEXT,
    "billingCycle" TEXT DEFAULT 'MONTHLY',
    "couponCode" TEXT,
    "paymentOrderId" TEXT,
    "paymentId" TEXT,
    "paymentStatus" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_sessions_token_key" ON "onboarding_sessions"("token");

-- CreateIndex
CREATE INDEX "onboarding_sessions_token_idx" ON "onboarding_sessions"("token");

-- CreateIndex
CREATE INDEX "onboarding_sessions_status_expiresAt_idx" ON "onboarding_sessions"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "platform_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
