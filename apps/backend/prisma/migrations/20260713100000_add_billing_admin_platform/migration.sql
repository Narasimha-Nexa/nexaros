-- This migration was created to match existing DB state
-- Tables were initially created via raw SQL and are now tracked

-- Extend tenants
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'India';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "city" TEXT;

-- New enums
DO $$ BEGIN
  CREATE TYPE "CouponType" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentPromiseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DemoRequestStatus" AS ENUM ('NEW', 'CONTACTED', 'SCHEDULED', 'CONVERTED', 'LOST');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SenderType" AS ENUM ('CUSTOMER', 'SUPPORT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- SubscriptionStatus new values
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'TRIAL';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'GRACE_PERIOD';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'RESTRICTED';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- Platform Plans
CREATE TABLE IF NOT EXISTS "platform_plans" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT,
  "price" DECIMAL(10,2) NOT NULL, "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
  "trialDays" INTEGER NOT NULL DEFAULT 14, "maxBranches" INTEGER NOT NULL DEFAULT 1,
  "maxStaff" INTEGER NOT NULL DEFAULT 10, "isCustom" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "platform_plans_slug_key" ON "platform_plans"("slug");

CREATE TABLE IF NOT EXISTS "plan_entitlements" (
  "id" TEXT NOT NULL, "planId" TEXT NOT NULL, "moduleKey" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "plan_entitlements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "plan_entitlements_planId_moduleKey_key" ON "plan_entitlements"("planId", "moduleKey");
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_planId_fkey" FOREIGN KEY ("planId") REFERENCES "platform_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "subscriptions_v2" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "planId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL', "entitlements" JSONB NOT NULL DEFAULT '{}',
  "customPrice" DECIMAL(10,2), "discount" DECIMAL(10,2),
  "trialStartedAt" TIMESTAMP(3), "trialEndsAt" TIMESTAMP(3),
  "currentPeriodStart" TIMESTAMP(3), "currentPeriodEnd" TIMESTAMP(3),
  "nextBillingDate" TIMESTAMP(3), "lastPaymentAt" TIMESTAMP(3),
  "gracePeriodDays" INTEGER NOT NULL DEFAULT 7, "graceStartedAt" TIMESTAMP(3),
  "hasPromise" BOOLEAN NOT NULL DEFAULT false, "promiseUntil" TIMESTAMP(3), "promiseReason" TEXT,
  "razorpayId" TEXT, "razorpayPlanId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_v2_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "subscriptions_v2_tenantId_status_idx" ON "subscriptions_v2"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "subscriptions_v2_status_nextBillingDate_idx" ON "subscriptions_v2"("status", "nextBillingDate");
ALTER TABLE "subscriptions_v2" ADD CONSTRAINT "subscriptions_v2_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions_v2" ADD CONSTRAINT "subscriptions_v2_planId_fkey" FOREIGN KEY ("planId") REFERENCES "platform_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "feature_flags" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "enabled" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_key_key" ON "feature_flags"("key");

CREATE TABLE IF NOT EXISTS "tenant_feature_flags" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "featureFlagId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenant_feature_flags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_feature_flags_tenantId_featureFlagId_key" ON "tenant_feature_flags"("tenantId", "featureFlagId");
ALTER TABLE "tenant_feature_flags" ADD CONSTRAINT "tenant_feature_flags_featureFlagId_fkey" FOREIGN KEY ("featureFlagId") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "coupons" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "description" TEXT, "type" "CouponType" NOT NULL DEFAULT 'FIXED_AMOUNT',
  "value" DECIMAL(10,2) NOT NULL, "maxDiscount" DECIMAL(10,2), "minPlanPrice" DECIMAL(10,2),
  "expiry" TIMESTAMP(3) NOT NULL, "maxTotalUses" INTEGER, "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
  "applicablePlans" TEXT[] NOT NULL DEFAULT '{}', "festivalTag" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");

CREATE TABLE IF NOT EXISTS "coupon_usages" (
  "id" TEXT NOT NULL, "couponId" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "subscriptionId" TEXT,
  "amount" DECIMAL(10,2) NOT NULL, "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "payment_promises" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "subscriptionId" TEXT NOT NULL,
  "reason" TEXT NOT NULL, "expectedDate" TIMESTAMP(3) NOT NULL,
  "status" "PaymentPromiseStatus" NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT, "approvedAt" TIMESTAMP(3), "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_promises_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "payment_promises" ADD CONSTRAINT "payment_promises_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "subscription_payments" (
  "id" TEXT NOT NULL, "subscriptionId" TEXT NOT NULL, "amount" DECIMAL(10,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL, "reference" TEXT, "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "subscription_invoices" (
  "id" TEXT NOT NULL, "subscriptionId" TEXT NOT NULL, "number" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL, "taxAmount" DECIMAL(10,2) NOT NULL,
  "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING', "pdfUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_invoices_number_key" ON "subscription_invoices"("number");
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "password" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'ADMIN', "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  "mfaSecret" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_key" ON "admin_users"("email");

CREATE TABLE IF NOT EXISTS "admin_sessions" (
  "id" TEXT NOT NULL, "adminUserId" TEXT NOT NULL, "token" TEXT NOT NULL,
  "ipAddress" TEXT, "userAgent" TEXT, "mfaVerified" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "admin_sessions_token_key" ON "admin_sessions"("token");
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" TEXT NOT NULL, "adminUserId" TEXT NOT NULL, "action" TEXT NOT NULL, "entity" TEXT NOT NULL,
  "entityId" TEXT, "oldData" JSONB, "newData" JSONB, "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "admin_audit_logs_adminUserId_createdAt_idx" ON "admin_audit_logs"("adminUserId", "createdAt");
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "demo_requests" (
  "id" TEXT NOT NULL, "restaurantName" TEXT NOT NULL, "contactName" TEXT NOT NULL,
  "email" TEXT NOT NULL, "phone" TEXT NOT NULL, "city" TEXT, "state" TEXT,
  "currentPos" TEXT, "message" TEXT, "status" "DemoRequestStatus" NOT NULL DEFAULT 'NEW',
  "assignedTo" TEXT, "notes" TEXT, "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" TEXT NOT NULL, "tenantId" TEXT NOT NULL, "subject" TEXT NOT NULL, "description" TEXT NOT NULL,
  "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL', "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "assignedTo" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ticket_messages" (
  "id" TEXT NOT NULL, "ticketId" TEXT NOT NULL, "senderType" "SenderType" NOT NULL, "senderId" TEXT NOT NULL,
  "message" TEXT NOT NULL, "isInternal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "value" JSONB NOT NULL, "description" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "platform_settings_key_key" ON "platform_settings"("key");
