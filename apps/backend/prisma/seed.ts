import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create default permissions
  const modules = [
    'dashboard', 'orders', 'menu', 'tables', 'inventory',
    'payments', 'invoices', 'staff', 'reservations', 'reports',
    'settings', 'branches', 'suppliers', 'purchases',
  ];
  const actions = ['create', 'read', 'update', 'delete'];

  const permissions = [];
  for (const mod of modules) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { module_action: { module: mod, action } },
        update: {},
        create: { module: mod, action, description: `${action} ${mod}` },
      });
      permissions.push(perm);
    }
  }
  console.log(`  ✅ Created ${permissions.length} permissions`);

  // 2. Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-restaurant' },
    update: {},
    create: {
      name: 'The Spice Kitchen',
      slug: 'demo-restaurant',
      phone: '+919876543210',
      email: 'admin@demo.com',
      address: '123 MG Road, Bangalore, Karnataka 560001',
      gstNumber: '29AADCB2230M1ZP',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });
  console.log(`  ✅ Created tenant: ${tenant.name}`);

  // 3. Create owner user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      phone: '+919876543210',
      password: hashedPassword,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'OWNER',
    },
  });
  console.log(`  ✅ Created owner: ${owner.firstName} ${owner.lastName}`);

  // 4. Create owner role with all permissions
  const ownerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Owner' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Owner',
      description: 'Full access to all features',
      isSystem: true,
      permissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });
  console.log(`  ✅ Created Owner role with ${permissions.length} permissions`);

  // 5. Create manager role
  const managerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Manager' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Manager',
      description: 'Manages daily operations',
      isSystem: false,
    },
  });

  // 6. Create waiter role
  const waiterRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Waiter' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Waiter',
      description: 'Takes orders and serves customers',
      isSystem: false,
    },
  });
  console.log(`  ✅ Created roles: Manager, Waiter`);

  // 7. Create branch
  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Main Branch - Koramangala',
      address: '45 Koramangala, Bangalore 560034',
      phone: '+919876543210',
      isPrimary: true,
    },
  });
  console.log(`  ✅ Created branch: ${branch.name}`);

  // 8. Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Starters', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Main Course', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Breads', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Rice & Biryani', sortOrder: 4 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Beverages', sortOrder: 5 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Desserts', sortOrder: 6 },
    }),
  ]);
  console.log(`  ✅ Created ${categories.length} categories`);

  // 9. Create menu items
  const menuItems = await Promise.all([
    // Starters
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[0].id,
        name: 'Chicken Tikka',
        description: 'Marinated chicken grilled in tandoor',
        price: 280,
        costPrice: 120,
        isVeg: false,
        prepTimeMin: 15,
        tags: ['bestseller', 'spicy'],
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[0].id,
        name: 'Paneer Tikka',
        description: 'Cottage cheese marinated in spices',
        price: 240,
        costPrice: 90,
        isVeg: true,
        prepTimeMin: 12,
        tags: ['vegetarian'],
      },
    }),
    // Main Course
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[1].id,
        name: 'Butter Chicken',
        description: 'Creamy tomato-based chicken curry',
        price: 350,
        costPrice: 140,
        isVeg: false,
        prepTimeMin: 20,
        tags: ['bestseller'],
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[1].id,
        name: 'Palak Paneer',
        description: 'Cottage cheese in spinach gravy',
        price: 280,
        costPrice: 100,
        isVeg: true,
        prepTimeMin: 15,
        tags: ['vegetarian'],
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[1].id,
        name: 'Dal Makhani',
        description: 'Black lentils slow-cooked with butter',
        price: 220,
        costPrice: 70,
        isVeg: true,
        prepTimeMin: 10,
        tags: ['vegetarian', 'bestseller'],
      },
    }),
    // Breads
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[2].id,
        name: 'Butter Naan',
        description: 'Soft naan baked in tandoor with butter',
        price: 60,
        costPrice: 15,
        isVeg: true,
        prepTimeMin: 8,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[2].id,
        name: 'Garlic Naan',
        description: 'Naan topped with garlic and butter',
        price: 70,
        costPrice: 18,
        isVeg: true,
        prepTimeMin: 8,
      },
    }),
    // Rice
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[3].id,
        name: 'Chicken Biryani',
        description: 'Hyderabadi style chicken biryani',
        price: 320,
        costPrice: 130,
        isVeg: false,
        prepTimeMin: 25,
        tags: ['bestseller'],
      },
    }),
    // Beverages
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[4].id,
        name: 'Masala Chai',
        description: 'Indian spiced tea',
        price: 40,
        costPrice: 10,
        isVeg: true,
        prepTimeMin: 5,
      },
    }),
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[4].id,
        name: 'Mango Lassi',
        description: 'Fresh mango yogurt smoothie',
        price: 80,
        costPrice: 30,
        isVeg: true,
        prepTimeMin: 5,
      },
    }),
    // Desserts
    prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId: categories[5].id,
        name: 'Gulab Jamun',
        description: 'Deep-fried milk dumplings in sugar syrup',
        price: 120,
        costPrice: 40,
        isVeg: true,
        prepTimeMin: 5,
      },
    }),
  ]);
  console.log(`  ✅ Created ${menuItems.length} menu items`);

  // 10. Create tables
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const table = await prisma.restaurantTable.create({
      data: {
        branchId: branch.id,
        number: i,
        name: i <= 2 ? `VIP ${i}` : undefined,
        capacity: i <= 2 ? 8 : i <= 6 ? 4 : 2,
        status: 'FREE',
      },
    });
    tables.push(table);
  }
  console.log(`  ✅ Created ${tables.length} tables`);

  // 11. Create staff members
  const staffMembers = await Promise.all([
    prisma.staff.create({
      data: {
        branchId: branch.id,
        roleId: managerRole.id,
        name: 'Amit Sharma',
        phone: '+919876543211',
        pin: '1234',
      },
    }),
    prisma.staff.create({
      data: {
        branchId: branch.id,
        roleId: waiterRole.id,
        name: 'Rahul Singh',
        phone: '+919876543212',
        pin: '5678',
      },
    }),
    prisma.staff.create({
      data: {
        branchId: branch.id,
        roleId: waiterRole.id,
        name: 'Priya Patel',
        phone: '+919876543213',
        pin: '9012',
      },
    }),
  ]);
  console.log(`  ✅ Created ${staffMembers.length} staff members`);

  console.log('\n🎉 Seed completed!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Email:    admin@demo.com');
  console.log('   Password: password123');
  console.log('   Restaurant: The Spice Kitchen');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
