-- Add customAmount column to support admin-entered pricing for custom/enterprise plans
ALTER TABLE "restaurant_provision_requests" ADD COLUMN "customAmount" DECIMAL(12, 2);
