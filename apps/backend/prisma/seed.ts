import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding platform data...');

  // ─── Permissions (35 modules × 4 actions = 140 permissions) ───
  const modules = [
    'dashboard', 'orders', 'pos', 'kitchen', 'tables', 'menu', 'categories',
    'inventory', 'suppliers', 'purchases', 'payments', 'invoices', 'finance',
    'staff', 'attendance', 'shifts', 'customers', 'reservations', 'reviews',
    'feedback', 'coupons', 'campaigns', 'loyalty', 'offers', 'reports',
    'analytics', 'branches', 'settings', 'website', 'notifications', 'ai',
    'delivery', 'crm', 'cms', 'omnichannel',
  ];
  const actions = ['create', 'read', 'update', 'delete'];

  let permCount = 0;
  for (const mod of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { module_action: { module: mod, action } },
        update: {},
        create: { module: mod, action, description: `${action} ${mod}` },
      });
      permCount++;
    }
  }
  console.log(`  ✅ Upserted ${permCount} permissions (${modules.length} modules × ${actions.length} actions)`);

  // ─── Feature Flags ───
  const featureFlags = [
    { key: 'pos', name: 'Point of Sale', description: 'POS terminal' },
    { key: 'kitchen', name: 'Kitchen Display', description: 'Kitchen order management' },
    { key: 'orders', name: 'Order Management', description: 'Full order lifecycle' },
    { key: 'tables', name: 'Table Management', description: 'Table tracking' },
    { key: 'inventory', name: 'Inventory', description: 'Stock tracking' },
    { key: 'staff', name: 'Staff Management', description: 'Employee management' },
    { key: 'reports', name: 'Reports', description: 'Analytics and reporting' },
    { key: 'ai_analytics', name: 'AI Analytics', description: 'AI-powered insights' },
    { key: 'crm', name: 'CRM', description: 'Customer relationship management' },
    { key: 'loyalty', name: 'Loyalty', description: 'Customer loyalty program' },
    { key: 'qr_ordering', name: 'QR Ordering', description: 'QR code based ordering' },
    { key: 'customer_website', name: 'Customer Website', description: 'Public website' },
    { key: 'reservations', name: 'Reservations', description: 'Table reservation system' },
    { key: 'multi_branch', name: 'Multi-Branch', description: 'Multiple branch management' },
    { key: 'api_access', name: 'API Access', description: 'External API integration' },
    { key: 'white_label', name: 'White Label', description: 'White label branding' },
    { key: 'priority_support', name: 'Priority Support', description: 'Priority support' },
  ];

  for (const ff of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: ff.key },
      update: {},
      create: ff,
    });
  }
  console.log(`  ✅ Upserted ${featureFlags.length} feature flags`);

  // ─── Platform Plans ───
  const plansData = [
    {
      name: 'Starter Free', slug: 'starter-free', description: 'Perfect for small restaurants just getting started',
      price: 0, billingCycle: 'MONTHLY' as const, trialDays: 14, maxBranches: 1, maxStaff: 5, sortOrder: 1,
      entitlements: {
        pos: true, kitchen: true, orders: true, tables: true, payments: true,
        invoices: false, inventory: false, staff: false, shifts: false, attendance: false,
        reports: false, ai_analytics: false, crm: false, loyalty: false, qr_ordering: false,
        customer_website: false, reservations: false, multi_branch: false, api_access: false,
        white_label: false, priority_support: false,
      },
    },
    {
      name: 'Professional', slug: 'professional', description: 'For growing restaurants that need full operations',
      price: 2, billingCycle: 'MONTHLY' as const, trialDays: 14, maxBranches: 2, maxStaff: 25, sortOrder: 2,
      entitlements: {
        pos: true, kitchen: true, orders: true, tables: true, payments: true,
        invoices: true, inventory: true, staff: true, shifts: true, attendance: true,
        reports: true, ai_analytics: false, crm: true, loyalty: false, qr_ordering: true,
        customer_website: false, reservations: true, multi_branch: false, api_access: false,
        white_label: false, priority_support: false,
      },
    },
    {
      name: 'Business', slug: 'business', description: 'For restaurant chains and large operations',
      price: 3, billingCycle: 'MONTHLY' as const, trialDays: 14, maxBranches: 10, maxStaff: 100, sortOrder: 3,
      entitlements: {
        pos: true, kitchen: true, orders: true, tables: true, payments: true,
        invoices: true, inventory: true, staff: true, shifts: true, attendance: true,
        reports: true, ai_analytics: true, crm: true, loyalty: true, qr_ordering: true,
        customer_website: true, reservations: true, multi_branch: true, api_access: true,
        white_label: false, priority_support: true,
      },
    },
    {
      name: 'Enterprise', slug: 'enterprise', description: 'Custom plan for large chains and franchises',
      price: 4, billingCycle: 'MONTHLY' as const, trialDays: 30, maxBranches: 100, maxStaff: 500,
      isCustom: true, sortOrder: 4,
      entitlements: {
        pos: true, kitchen: true, orders: true, tables: true, payments: true,
        invoices: true, inventory: true, staff: true, shifts: true, attendance: true,
        reports: true, ai_analytics: true, crm: true, loyalty: true, qr_ordering: true,
        customer_website: true, reservations: true, multi_branch: true, api_access: true,
        white_label: true, priority_support: true,
      },
    },
  ];

  for (const plan of plansData) {
    const { entitlements, ...planData } = plan;
    const existing = await prisma.platformPlan.findUnique({ where: { slug: plan.slug } });
    if (!existing) {
      await prisma.platformPlan.create({
        data: {
          ...planData,
          entitlements: {
            createMany: {
              data: Object.entries(entitlements).map(([moduleKey, enabled]) => ({ moduleKey, enabled })),
            },
          },
        },
      });
    }
  }
  console.log(`  ✅ Upserted ${plansData.length} platform plans`);

  // ─── Admin User ───
  const existingAdmin = await prisma.adminUser.findFirst({ where: { email: 'admin@nexaros.com' } });
  if (!existingAdmin) {
    const adminPassword = await bcrypt.hash('admin123', 12);
    await prisma.adminUser.create({
      data: {
        email: 'admin@nexaros.com',
        name: 'Platform Admin',
        password: adminPassword,
        role: 'SUPER_ADMIN',
      },
    });
    console.log('  ✅ Created admin: admin@nexaros.com / admin123');
  } else {
    console.log('  ⏭️  Admin user already exists');
  }

  const totalPerms = await prisma.permission.count();
  const totalPlans = await prisma.platformPlan.count();
  const totalAdmins = await prisma.adminUser.count();
  const totalFlags = await prisma.featureFlag.count();

  console.log('\n🎉 Seed completed!');
  console.log(`   🔐 ${totalPerms} permissions | 🚩 ${totalFlags} feature flags`);
  console.log(`   📦 ${totalPlans} platform plans | 👤 ${totalAdmins} admin users`);
  console.log('\n🔧 Admin Credentials:');
  console.log('   Email:    admin@nexaros.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
