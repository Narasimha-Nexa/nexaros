-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "restaurant_provision_requests" DROP CONSTRAINT "restaurant_provision_requests_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "staff" DROP CONSTRAINT "staff_tenantId_fkey";

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_provision_requests" ADD CONSTRAINT "restaurant_provision_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
