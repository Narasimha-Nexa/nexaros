-- AlterTable
ALTER TABLE "onboarding_sessions" ALTER COLUMN "restaurantName" DROP NOT NULL,
ALTER COLUMN "ownerName" DROP NOT NULL,
ALTER COLUMN "ownerEmail" DROP NOT NULL;

-- CreateTable
CREATE TABLE "restaurant_provision_requests" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "restaurantName" TEXT NOT NULL,
    "slug" TEXT,
    "subdomain" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'India',
    "cuisineType" TEXT,
    "gstNumber" TEXT,
    "timezone" TEXT DEFAULT 'Asia/Kolkata',
    "currency" TEXT DEFAULT 'INR',
    "logo" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerPhone" TEXT,
    "password" TEXT,
    "autoGenPassword" BOOLEAN NOT NULL DEFAULT true,
    "planId" TEXT,
    "billingCycle" TEXT DEFAULT 'MONTHLY',
    "couponCode" TEXT,
    "discountAmount" DECIMAL(12,2) DEFAULT 0,
    "discountType" TEXT,
    "subtotal" DECIMAL(12,2) DEFAULT 0,
    "taxRate" DECIMAL(5,2) DEFAULT 18,
    "taxAmount" DECIMAL(12,2) DEFAULT 0,
    "totalAmount" DECIMAL(12,2) DEFAULT 0,
    "currencyCode" TEXT DEFAULT 'INR',
    "paymentProvider" TEXT DEFAULT 'razorpay',
    "paymentOrderId" TEXT,
    "paymentId" TEXT,
    "paymentSignature" TEXT,
    "paymentStatus" TEXT DEFAULT 'UNPAID',
    "tenantId" TEXT,
    "branchId" TEXT,
    "ownerId" TEXT,
    "staffId" TEXT,
    "subscriptionId" TEXT,
    "progress" JSONB,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "restaurant_provision_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" TEXT NOT NULL,
    "provisionRequestId" TEXT,
    "tenantId" TEXT,
    "event" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "amount" DECIMAL(12,2),
    "currency" TEXT DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_provision_requests_token_key" ON "restaurant_provision_requests"("token");

-- CreateIndex
CREATE INDEX "restaurant_provision_requests_token_idx" ON "restaurant_provision_requests"("token");

-- CreateIndex
CREATE INDEX "restaurant_provision_requests_status_idx" ON "restaurant_provision_requests"("status");

-- CreateIndex
CREATE INDEX "restaurant_provision_requests_tenantId_idx" ON "restaurant_provision_requests"("tenantId");

-- CreateIndex
CREATE INDEX "restaurant_provision_requests_createdAt_idx" ON "restaurant_provision_requests"("createdAt");

-- CreateIndex
CREATE INDEX "payment_events_provisionRequestId_idx" ON "payment_events"("provisionRequestId");

-- CreateIndex
CREATE INDEX "payment_events_tenantId_idx" ON "payment_events"("tenantId");

-- CreateIndex
CREATE INDEX "payment_events_event_idx" ON "payment_events"("event");

-- AddForeignKey
ALTER TABLE "restaurant_provision_requests" ADD CONSTRAINT "restaurant_provision_requests_planId_fkey" FOREIGN KEY ("planId") REFERENCES "platform_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_provision_requests" ADD CONSTRAINT "restaurant_provision_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
