-- Schema Hardening Migration (Final)
-- All core business models now have: deletedAt, version, createdBy, updatedBy
-- Safe: all changes are additive (no columns dropped, no data deleted)

-- ─────────────────────────────────────────────
-- 1. TENANT: already has version, createdBy, deletedAt
-- ─────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- 2. USER: add updatedBy, version
-- ─────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- ─────────────────────────────────────────────
-- 3. BRANCH: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 4. ROLE: add version, deletedAt, createdBy, updatedBy, tenantId index
-- ─────────────────────────────────────────────
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
CREATE INDEX IF NOT EXISTS "roles_tenantId_idx" ON "roles"("tenantId");

-- ─────────────────────────────────────────────
-- 5. STAFF: add tenantId, version, deletedAt, createdBy, updatedBy + indexes
-- ─────────────────────────────────────────────
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
CREATE INDEX IF NOT EXISTS "staff_tenantId_idx" ON "staff"("tenantId");

-- ─────────────────────────────────────────────
-- 6. CATEGORY: add version, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 7. MENU_ITEM: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 8. MENU_ITEM_VARIANT: add menuItemId index
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "menu_item_variants_menuItemId_idx" ON "menu_item_variants"("menuItemId");

-- ─────────────────────────────────────────────
-- 9. MENU_ITEM_ADD_ON: add menuItemId index
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "menu_item_add_ons_menuItemId_idx" ON "menu_item_add_ons"("menuItemId");

-- ─────────────────────────────────────────────
-- 10. RESTAURANT_TABLE: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "restaurant_tables" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "restaurant_tables" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "restaurant_tables" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "restaurant_tables" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 11. ORDER: add tenantId, version, deletedAt, createdBy + indexes
-- ─────────────────────────────────────────────
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
CREATE INDEX IF NOT EXISTS "orders_tenantId_idx" ON "orders"("tenantId");

-- ─────────────────────────────────────────────
-- 12. ORDER_ITEM: add version, deletedAt, createdBy, updatedBy + indexes
-- ─────────────────────────────────────────────
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX IF NOT EXISTS "order_item_add_ons_orderItemId_idx" ON "order_item_add_ons"("orderItemId");

-- ─────────────────────────────────────────────
-- 13. ORDER_STATUS_HISTORY: add createdBy
-- ─────────────────────────────────────────────
ALTER TABLE "order_status_history" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- ─────────────────────────────────────────────
-- 14. PAYMENT: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "payments_orderId_idx" ON "payments"("orderId");

-- ─────────────────────────────────────────────
-- 15. INVOICE: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- ─────────────────────────────────────────────
-- 16. INVENTORY_ITEM: add createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 17. STOCK_MOVEMENT: add createdBy
-- ─────────────────────────────────────────────
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- ─────────────────────────────────────────────
-- 18. SUPPLIER: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "suppliers" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 19. PURCHASE: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 20. PURCHASE_ITEM: add inventoryItemId index
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "purchase_items_inventoryItemId_idx" ON "purchase_items"("inventoryItemId");

-- ─────────────────────────────────────────────
-- 21. RESERVATION: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 22. SHIFT: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ─────────────────────────────────────────────
-- 23. STAFF_SHIFT: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "staff_shifts" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "staff_shifts" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "staff_shifts" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "staff_shifts" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 24. ATTENDANCE: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "attendance" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 25. PLATFORM_PLAN: add createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "platform_plans" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "platform_plans" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 26. PLAN_ENTITLEMENT: add createdAt
-- ─────────────────────────────────────────────
ALTER TABLE "plan_entitlements" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ─────────────────────────────────────────────
-- 27. SUBSCRIPTION: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "subscriptions_v2" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "subscriptions_v2" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "subscriptions_v2" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "subscriptions_v2" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 28. COUPON: add version, deletedAt, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- ─────────────────────────────────────────────
-- 29. PAYMENT_PROMISE: add version, deletedAt, createdBy, updatedBy + indexes
-- ─────────────────────────────────────────────
ALTER TABLE "payment_promises" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "payment_promises" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "payment_promises" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "payment_promises" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
CREATE INDEX IF NOT EXISTS "payment_promises_tenantId_idx" ON "payment_promises"("tenantId");
CREATE INDEX IF NOT EXISTS "payment_promises_subscriptionId_idx" ON "payment_promises"("subscriptionId");

-- ─────────────────────────────────────────────
-- 30. SUBSCRIPTION_PAYMENT: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "subscription_payments" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- ─────────────────────────────────────────────
-- 31. SUBSCRIPTION_INVOICE: add version, deletedAt, createdBy, updatedBy
-- ─────────────────────────────────────────────
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "subscription_invoices" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- ─────────────────────────────────────────────
-- 32. ADMIN_USER: add version, deletedAt
-- ─────────────────────────────────────────────
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "admin_users" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- ─────────────────────────────────────────────
-- 33. DEMO_REQUEST: add version, deletedAt, createdBy, updatedBy + index
-- ─────────────────────────────────────────────
ALTER TABLE "demo_requests" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "demo_requests" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "demo_requests" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "demo_requests" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
CREATE INDEX IF NOT EXISTS "demo_requests_status_idx" ON "demo_requests"("status");

-- ─────────────────────────────────────────────
-- 34. SUPPORT_TICKET: add version, deletedAt, createdBy, updatedBy + indexes
-- ─────────────────────────────────────────────
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
CREATE INDEX IF NOT EXISTS "support_tickets_tenantId_idx" ON "support_tickets"("tenantId");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");

-- ─────────────────────────────────────────────
-- 35. TICKET_MESSAGE: add senderId index
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "ticket_messages_senderId_idx" ON "ticket_messages"("senderId");

-- ─────────────────────────────────────────────
-- 36. TENANT_WEBSITE_CONFIG: add version, deletedAt, createdBy
-- ─────────────────────────────────────────────
ALTER TABLE "tenant_website_configs" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "tenant_website_configs" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "tenant_website_configs" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- ─────────────────────────────────────────────
-- 37. FEATURE_FLAG: add createdAt
-- ─────────────────────────────────────────────
ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ─────────────────────────────────────────────
-- 38. TENANT_FEATURE_FLAG: add tenantId index
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "tenant_feature_flags_tenantId_idx" ON "tenant_feature_flags"("tenantId");
