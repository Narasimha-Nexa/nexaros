-- TenantWebsiteConfig: CMS configuration for each tenant's customer website
-- To be added to schema.prisma and run as a migration

CREATE TABLE "tenant_website_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL UNIQUE REFERENCES "tenants"("id") ON DELETE CASCADE,

    -- Global Settings
    "restaurantName" TEXT NOT NULL DEFAULT '',
    "tagline" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "mapUrl" TEXT,
    "whatsappNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',

    -- Branding
    "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "secondaryColor" TEXT NOT NULL DEFAULT '#171717',
    "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "fontHeading" TEXT NOT NULL DEFAULT 'Playfair Display',
    "fontBody" TEXT NOT NULL DEFAULT 'Inter',
    "borderRadius" TEXT NOT NULL DEFAULT 'xl',
    "containerWidth" TEXT NOT NULL DEFAULT 'max-w-7xl',

    -- Features (JSON)
    "features" JSON NOT NULL DEFAULT '{}',
    -- SEO (JSON)
    "seo" JSON NOT NULL DEFAULT '{}',
    -- Opening Hours (JSON)
    "openingHours" JSON NOT NULL DEFAULT '{}',
    -- Social Links (JSON)
    "socialLinks" JSON NOT NULL DEFAULT '{}',
    -- Analytics (JSON)
    "analytics" JSON NOT NULL DEFAULT '{}',
    -- Legal Pages (JSON)
    "legalPages" JSON NOT NULL DEFAULT '{}',
    -- Home Page Sections (JSON - ordered array of section configs)
    "homeSections" JSON NOT NULL DEFAULT '[]',

    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_tenant_website_configs_tenant" ON "tenant_website_configs"("tenantId");
