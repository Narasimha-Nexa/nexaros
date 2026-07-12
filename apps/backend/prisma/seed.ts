import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── VEG CATEGORIES (all items in these are veg) ───
const VEG_CATEGORY_NAMES = [
  'VEG STARTERS', 'VEG CURRIES', 'VEG BIRYANI',
  'ROTIS & NAANS', 'MOCKTAILS & DRINKS', 'ICE CREAMS', 'SOFT DRINKS',
];

function isVegItem(categoryName: string, itemName: string): boolean {
  if (VEG_CATEGORY_NAMES.includes(categoryName)) return true;
  if (categoryName.startsWith('NON-VEG') || categoryName === 'SEAFOOD STARTERS' || categoryName === 'SHAWARMA') return false;
  const name = itemName.toLowerCase();
  if (name.includes('veg ') || name.startsWith('veg ') || name.includes('paneer') || name.includes('mushroom') || name.includes('kaju') || name.includes('baby corn') || name.includes('gobi') || name.includes('dal ') || name.includes('jeera') || name.includes('ghee') || name.includes('curd') || name.includes('steam rice') || name.includes('pulka') || name.includes('roti') || name.includes('naan') || name.includes('kulcha') || name.includes('lassi') || name.includes('buttermilk') || name.includes('soda') || name.includes('crush') || name.includes('shake') || name.includes('mojito') || name.includes('lemon ginger') || name.includes('orange blast') || name.includes('honey lemon') || name.includes('blue lagoon') || name.includes('guava') || name.includes('topical') || name.includes('vanilla') || name.includes('strawberry') || name.includes('pista') || name.includes('butter scotch') || name.includes('chocolate') || name.includes('sundae') || name.includes('thums up') || name.includes('sprite') || name.includes('coca') || name.includes('water bottle') || name.includes('sweet soda') || name.includes('rose milk') || name.includes('rose lassi') || name.includes('mango lassi') || name.includes('mango crush')) return true;
  if (name.includes('chicken') || name.includes('mutton') || name.includes('egg') || name.includes('fish') || name.includes('prawn') || name.includes('shawarma') || name.includes('tandoori') || name.includes('tikka') || name.includes('tangdi') || name.includes('grill') || name.includes('kebab') || name.includes('lollipop') || name.includes('wings') || name.includes('dragon') || name.includes('hawai') || name.includes('lemon chicken') || name.includes('honey chicken') || name.includes('red bull') || name.includes('mangolia') || name.includes('gurjala') || name.includes('karivepaku') || name.includes('pepper') || name.includes('rr chicken') || name.includes('apollo') || name.includes('fried fish') || name.includes('dum biryani') || name.includes('fry piece') || name.includes('hungry island') || name.includes('joint biryani') || name.includes('kothimeera') || name.includes('mogalai') || name.includes('gongura') || name.includes('tikka biryani') || name.includes('kings biryani') || name.includes('juicy biryani') || name.includes('rambo') || name.includes('afgani') || name.includes('maharaja') || name.includes('punjabi') || name.includes('kheema') || name.includes('mixed non-veg') || name.includes('family pack') && !name.startsWith('veg') && !name.startsWith('paneer') && !name.startsWith('mushroom') || name.includes('juicy mandi') || name.includes('ghatotkacha')) return false;
  if (name.includes('dilkush')) return true;
  return false;
}

const CATEGORIES_DATA = [
  { name: 'SOUPS', sortOrder: 1 },
  { name: 'VEG STARTERS', sortOrder: 2 },
  { name: 'NON-VEG STARTERS', sortOrder: 3 },
  { name: 'SEAFOOD STARTERS', sortOrder: 4 },
  { name: 'VEG CURRIES', sortOrder: 5 },
  { name: 'NON-VEG CURRIES', sortOrder: 6 },
  { name: 'TANDOORI', sortOrder: 7 },
  { name: 'FRIED RICE & NOODLES', sortOrder: 8 },
  { name: 'ROTIS & NAANS', sortOrder: 9 },
  { name: 'VEG BIRYANI', sortOrder: 10 },
  { name: 'NON-VEG BIRYANI', sortOrder: 11 },
  { name: 'SPECIAL BIRYANIS', sortOrder: 12 },
  { name: 'FAMILY PACKS', sortOrder: 13 },
  { name: 'SHAWARMA', sortOrder: 14 },
  { name: 'MANDI', sortOrder: 15 },
  { name: 'MOCKTAILS & DRINKS', sortOrder: 16 },
  { name: 'ICE CREAMS', sortOrder: 17 },
  { name: 'SOFT DRINKS', sortOrder: 18 },
];

// [categoryName, itemName, price]
const MENU_ITEMS_DATA: [string, string, number][] = [
  // SOUPS
  ['SOUPS', 'Veg Hot N Sour', 99],
  ['SOUPS', 'Veg Corn Soup', 119],
  ['SOUPS', 'Veg Manchow Soup', 119],
  ['SOUPS', 'Veg Clear Soup', 129],
  ['SOUPS', 'Chicken Hot N Sour', 129],
  ['SOUPS', 'Chicken Corn Soup', 129],
  ['SOUPS', 'Chicken Manchow', 139],
  ['SOUPS', 'Chicken Clear Soup', 139],
  ['SOUPS', 'Mutton Bone Soup', 160],
  ['SOUPS', 'Mutton Boneless Soup', 180],

  // VEG STARTERS
  ['VEG STARTERS', 'Veg Manchuria', 130],
  ['VEG STARTERS', 'Gobi Manchuria', 130],
  ['VEG STARTERS', 'Special Veg Manchuria', 150],
  ['VEG STARTERS', 'Mushroom 65', 180],
  ['VEG STARTERS', 'Chilli Mushroom', 180],
  ['VEG STARTERS', 'Mushroom Manchuria', 180],
  ['VEG STARTERS', 'Paneer Manchuria', 210],
  ['VEG STARTERS', 'Baby Corn Majestic', 220],
  ['VEG STARTERS', 'Baby Corn 65', 220],
  ['VEG STARTERS', 'Paneer Majestic', 260],

  // NON-VEG STARTERS
  ['NON-VEG STARTERS', 'Egg Burji', 130],
  ['NON-VEG STARTERS', 'Egg Manchuria', 190],
  ['NON-VEG STARTERS', 'Chicken Manchuria', 219],
  ['NON-VEG STARTERS', 'Chicken Roast', 240],
  ['NON-VEG STARTERS', 'Chilli Chicken', 249],
  ['NON-VEG STARTERS', 'Chicken 65', 280],
  ['NON-VEG STARTERS', 'Chicken 555', 280],
  ['NON-VEG STARTERS', 'Dragon Chicken', 280],
  ['NON-VEG STARTERS', 'Hawai Chicken', 290],
  ['NON-VEG STARTERS', 'Chicken Majestic', 290],
  ['NON-VEG STARTERS', 'Lemon Chicken', 290],
  ['NON-VEG STARTERS', 'Honey Chicken', 320],
  ['NON-VEG STARTERS', 'Chicken Lollipop (5 pcs)', 320],
  ['NON-VEG STARTERS', 'Special Baby Wings (12 pcs)', 320],
  ['NON-VEG STARTERS', 'Red Bull Chicken', 340],
  ['NON-VEG STARTERS', 'Chicken Mangolia', 340],
  ['NON-VEG STARTERS', 'Mutton 85', 340],
  ['NON-VEG STARTERS', 'Chicken Gurjala', 349],
  ['NON-VEG STARTERS', 'Karivepaku Kodi', 350],
  ['NON-VEG STARTERS', 'Pepper Chicken', 359],
  ['NON-VEG STARTERS', 'RR Chicken', 360],

  // SEAFOOD STARTERS
  ['SEAFOOD STARTERS', 'Apollo Fish', 299],
  ['SEAFOOD STARTERS', 'Fish 65', 299],
  ['SEAFOOD STARTERS', 'Chilli Fish', 310],
  ['SEAFOOD STARTERS', 'Fish Roast', 310],
  ['SEAFOOD STARTERS', 'Pepper Fish', 320],
  ['SEAFOOD STARTERS', 'Fried Fish', 330],
  ['SEAFOOD STARTERS', 'Pepper Prawns', 310],
  ['SEAFOOD STARTERS', 'Dragon Prawns', 310],
  ['SEAFOOD STARTERS', 'Loose Prawns', 320],
  ['SEAFOOD STARTERS', 'Chilli Prawns', 320],
  ['SEAFOOD STARTERS', 'Golden Fried Prawns', 330],

  // VEG CURRIES
  ['VEG CURRIES', 'Veg Mixed Curry', 120],
  ['VEG CURRIES', 'Paneer Butter Masala', 200],
  ['VEG CURRIES', 'Mushroom Curry', 200],
  ['VEG CURRIES', 'Kaju Curry', 240],
  ['VEG CURRIES', 'Methi Chaman Curry', 200],
  ['VEG CURRIES', 'Palak Chaman Paneer', 200],
  ['VEG CURRIES', 'Kaju Tomato Curry', 260],
  ['VEG CURRIES', 'Kaju Paneer Curry', 270],

  // NON-VEG CURRIES
  ['NON-VEG CURRIES', 'Egg Curry', 160],
  ['NON-VEG CURRIES', 'Chicken Bone Curry', 200],
  ['NON-VEG CURRIES', 'Chicken Boneless Curry', 220],
  ['NON-VEG CURRIES', 'Butter Chicken', 250],
  ['NON-VEG CURRIES', 'Andhra Chicken', 250],
  ['NON-VEG CURRIES', 'Kadai Chicken', 260],
  ['NON-VEG CURRIES', 'Mogalai Chicken', 260],
  ['NON-VEG CURRIES', 'Mutton Curry', 330],
  ['NON-VEG CURRIES', 'Mutton Fry', 310],
  ['NON-VEG CURRIES', 'Prawns Curry', 290],
  ['NON-VEG CURRIES', 'Andhra Mutton', 330],
  ['NON-VEG CURRIES', 'Gongura Mutton', 330],
  ['NON-VEG CURRIES', 'Chicken Maharani', 310],
  ['NON-VEG CURRIES', 'Mutton Maharani', 390],
  ['NON-VEG CURRIES', 'Gongura Prawns', 310],
  ['NON-VEG CURRIES', 'Kadai Mutton', 340],

  // TANDOORI
  ['TANDOORI', 'Tandoori Full (8 pcs)', 550],
  ['TANDOORI', 'Tandoori Half (4 pcs)', 280],
  ['TANDOORI', 'Chicken Tikka (8 pcs)', 300],
  ['TANDOORI', 'Tangdi Kebab Full (4 pcs)', 360],
  ['TANDOORI', 'Tangdi Kebab Half (2 pcs)', 180],
  ['TANDOORI', 'Hariyali Kebab', 280],
  ['TANDOORI', 'Paneer Tikka', 280],
  ['TANDOORI', 'Grill Chicken Full', 490],
  ['TANDOORI', 'Grill Chicken Half', 280],

  // FRIED RICE & NOODLES
  ['FRIED RICE & NOODLES', 'Jeera Rice', 160],
  ['FRIED RICE & NOODLES', 'Veg Fried Rice', 160],
  ['FRIED RICE & NOODLES', 'Egg Fried Rice', 170],
  ['FRIED RICE & NOODLES', 'Ghee Fried Rice', 190],
  ['FRIED RICE & NOODLES', 'Chicken Fried Rice', 220],
  ['FRIED RICE & NOODLES', 'Paneer Fried Rice', 220],
  ['FRIED RICE & NOODLES', 'Paneer Special Fried Rice', 270],
  ['FRIED RICE & NOODLES', 'Mushroom Fried Rice', 230],
  ['FRIED RICE & NOODLES', 'Chicken Noodles', 220],
  ['FRIED RICE & NOODLES', 'Egg Noodles', 180],
  ['FRIED RICE & NOODLES', 'Veg Noodles', 150],
  ['FRIED RICE & NOODLES', 'Kaju Fried Rice', 230],
  ['FRIED RICE & NOODLES', 'Kaju Special Fried Rice', 260],
  ['FRIED RICE & NOODLES', 'Special Chicken Fried Rice', 270],
  ['FRIED RICE & NOODLES', 'Mixed Non-Veg Fried Rice', 350],
  ['FRIED RICE & NOODLES', 'Mutton Fried Rice', 370],
  ['FRIED RICE & NOODLES', 'Prawns Fried Rice', 360],
  ['FRIED RICE & NOODLES', 'Curd Rice', 90],
  ['FRIED RICE & NOODLES', 'Special Curd Rice', 120],
  ['FRIED RICE & NOODLES', 'Steam Rice', 140],

  // ROTIS & NAANS
  ['ROTIS & NAANS', 'Pulka', 15],
  ['ROTIS & NAANS', 'Tandoori Roti', 35],
  ['ROTIS & NAANS', 'Butter Roti', 40],
  ['ROTIS & NAANS', 'Garlic Roti', 45],
  ['ROTIS & NAANS', 'Butter Naan', 45],
  ['ROTIS & NAANS', 'Garlic Naan', 50],
  ['ROTIS & NAANS', 'Aloo Kulcha', 80],
  ['ROTIS & NAANS', 'Paneer Kulcha', 100],
  ['ROTIS & NAANS', 'Masala Kulcha', 100],
  ['ROTIS & NAANS', 'Chicken Kulcha', 120],

  // VEG BIRYANI
  ['VEG BIRYANI', 'Veg Biryani', 189],
  ['VEG BIRYANI', 'Gongura Biryani', 189],
  ['VEG BIRYANI', 'Egg Biryani', 240],
  ['VEG BIRYANI', 'Paneer Biryani', 270],
  ['VEG BIRYANI', 'Mushroom Biryani', 270],
  ['VEG BIRYANI', 'Kaju Biryani', 270],
  ['VEG BIRYANI', 'Kaju Special Biryani', 299],
  ['VEG BIRYANI', 'Paneer Kaju Biryani', 320],

  // NON-VEG BIRYANI
  ['NON-VEG BIRYANI', 'Mini Dum Biryani', 160],
  ['NON-VEG BIRYANI', 'Dum Biryani', 260],
  ['NON-VEG BIRYANI', 'Mini Fry Piece Biryani', 170],
  ['NON-VEG BIRYANI', 'Fry Piece Biryani', 270],
  ['NON-VEG BIRYANI', 'Hungry Island Special Biryani (Bone)', 280],
  ['NON-VEG BIRYANI', 'Hungry Island Special Biryani (Boneless)', 300],
  ['NON-VEG BIRYANI', 'Joint Biryani', 269],
  ['NON-VEG BIRYANI', 'Kothimeera Biryani', 269],
  ['NON-VEG BIRYANI', 'Mogalai Biryani', 289],
  ['NON-VEG BIRYANI', 'Gongura Biryani', 290],
  ['NON-VEG BIRYANI', 'Lollipop Biryani', 300],
  ['NON-VEG BIRYANI', 'Wings Biryani', 300],
  ['NON-VEG BIRYANI', 'Tikka Biryani', 320],
  ['NON-VEG BIRYANI', 'Kings Biryani', 339],
  ['NON-VEG BIRYANI', 'Fish Juicy Biryani', 340],
  ['NON-VEG BIRYANI', 'Prawns Biryani', 349],
  ['NON-VEG BIRYANI', 'Gongura Prawns Biryani', 349],
  ['NON-VEG BIRYANI', 'Gongura Mutton Biryani', 369],
  ['NON-VEG BIRYANI', 'Mutton Biryani', 379],
  ['NON-VEG BIRYANI', 'Rambo Biryani', 389],

  // SPECIAL BIRYANIS
  ['SPECIAL BIRYANIS', 'Afgani Biryani', 310],
  ['SPECIAL BIRYANIS', 'Dilkush Biryani', 320],
  ['SPECIAL BIRYANIS', 'Tangdi Biryani', 320],
  ['SPECIAL BIRYANIS', 'Chicken Maharaja Biryani', 340],
  ['SPECIAL BIRYANIS', 'Punjabi Chicken Biryani', 350],
  ['SPECIAL BIRYANIS', 'Andhra Mutton Biryani', 390],
  ['SPECIAL BIRYANIS', 'Mutton Kheema Biryani', 399],
  ['SPECIAL BIRYANIS', 'Mixed Non-Veg Biryani', 399],
  ['SPECIAL BIRYANIS', 'Mutton Maharaja Biryani', 420],

  // FAMILY PACKS
  ['FAMILY PACKS', 'Veg Family Pack', 549],
  ['FAMILY PACKS', 'Paneer Family Pack', 549],
  ['FAMILY PACKS', 'Mushroom Family Pack', 549],
  ['FAMILY PACKS', 'Chicken Dum Family Pack', 650],
  ['FAMILY PACKS', 'Chicken Fry Family Pack', 650],
  ['FAMILY PACKS', 'Chicken Wing Family Pack', 650],
  ['FAMILY PACKS', 'Chicken Lollipop Family Pack', 650],
  ['FAMILY PACKS', 'Mutton Fry Family Pack', 900],
  ['FAMILY PACKS', 'Kumbakarna Family Pack', 890],

  // SHAWARMA
  ['SHAWARMA', 'Regular Shawarma', 120],
  ['SHAWARMA', 'Special Shawarma', 140],
  ['SHAWARMA', 'Spicy Chicken Shawarma', 140],
  ['SHAWARMA', 'Schezwan Shawarma', 140],
  ['SHAWARMA', 'Mint Mayo Shawarma', 140],
  ['SHAWARMA', 'Sweet Chilli Shawarma', 140],
  ['SHAWARMA', 'Chicken Peri Peri Shawarma', 140],
  ['SHAWARMA', 'Cheese & Spice Shawarma', 160],
  ['SHAWARMA', 'Special Chicken Plate Shawarma', 169],
  ['SHAWARMA', 'Fully Loaded Chicken Shawarma', 180],
  ['SHAWARMA', 'Special Kaju Shawarma', 180],
  ['SHAWARMA', 'Chilli Chicken Shawarma', 220],

  // MANDI
  ['MANDI', 'Tandoori Mandi Full', 880],
  ['MANDI', 'Tandoori Mandi Half', 490],
  ['MANDI', 'Juicy Mandi Full', 880],
  ['MANDI', 'Juicy Mandi Half', 490],
  ['MANDI', 'Afgani Mandi Full', 999],
  ['MANDI', 'Afgani Mandi Half', 560],
  ['MANDI', 'Lollipop Mandi Full', 1120],
  ['MANDI', 'Lollipop Mandi Half', 600],
  ['MANDI', 'Prawns Juicy Mandi Full', 1200],
  ['MANDI', 'Prawns Juicy Mandi Half', 650],
  ['MANDI', 'Mutton Juicy Mandi Full', 1300],
  ['MANDI', 'Mutton Juicy Mandi Half', 700],
  ['MANDI', 'Fish Juicy Mandi Full', 1200],
  ['MANDI', 'Fish Juicy Mandi Half', 650],
  ['MANDI', 'Mixed Non-Veg Mandi Full', 1200],
  ['MANDI', 'Mixed Non-Veg Mandi Half', 700],
  ['MANDI', 'Special Ghatotkacha Mandi', 1500],
  ['MANDI', 'Paneer Mandi Full', 1000],
  ['MANDI', 'Paneer Mandi Half', 550],

  // MOCKTAILS & DRINKS
  ['MOCKTAILS & DRINKS', 'Topical Fizz', 120],
  ['MOCKTAILS & DRINKS', 'Guava Salsa', 120],
  ['MOCKTAILS & DRINKS', 'Virgin Mojito', 90],
  ['MOCKTAILS & DRINKS', 'Blue Lagoon', 90],
  ['MOCKTAILS & DRINKS', 'Lemon Ginger', 90],
  ['MOCKTAILS & DRINKS', 'Orange Blast', 90],
  ['MOCKTAILS & DRINKS', 'Honey Lemon', 90],
  ['MOCKTAILS & DRINKS', 'Mango Crush', 90],
  ['MOCKTAILS & DRINKS', 'Strawberry Crush', 90],
  ['MOCKTAILS & DRINKS', 'Mango Lassi', 100],
  ['MOCKTAILS & DRINKS', 'Rose Lassi', 100],
  ['MOCKTAILS & DRINKS', 'Buttermilk', 40],
  ['MOCKTAILS & DRINKS', 'Sweet Soda', 40],
  ['MOCKTAILS & DRINKS', 'Salt Soda', 40],
  ['MOCKTAILS & DRINKS', 'Chocolate Milk Shake', 120],
  ['MOCKTAILS & DRINKS', 'Strawberry Shake', 120],
  ['MOCKTAILS & DRINKS', 'Rose Milk Shake', 120],
  ['MOCKTAILS & DRINKS', 'Lassi', 60],

  // ICE CREAMS
  ['ICE CREAMS', 'Vanilla', 75],
  ['ICE CREAMS', 'Strawberry', 75],
  ['ICE CREAMS', 'Pista', 85],
  ['ICE CREAMS', 'Butter Scotch', 95],
  ['ICE CREAMS', 'Chocolate', 95],
  ['ICE CREAMS', 'Ultimate Sundae', 130],

  // SOFT DRINKS
  ['SOFT DRINKS', 'Thums Up 250ml (MRP)', 20],
  ['SOFT DRINKS', 'Sprite 250ml (MRP)', 20],
  ['SOFT DRINKS', 'Coca-Cola 250ml (MRP)', 20],
  ['SOFT DRINKS', 'Water Bottle 500ml (MRP)', 20],
];

async function main() {
  console.log('🌱 Seeding database with real menu data...');

  // ─── Permissions ───
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

  // ─── Tenant ───
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-restaurant' },
    update: {},
    create: {
      name: 'Hungry Island',
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

  // ─── Owner ───
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

  // ─── Roles ───
  const ownerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Owner' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Owner',
      description: 'Full access to all features',
      isSystem: true,
      permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Manager' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Manager',
      description: 'Manages daily operations',
      permissions: {
        create: permissions
          .filter(p => ['orders', 'menu', 'tables', 'inventory', 'payments', 'reports', 'staff'].includes(p.module) && p.action !== 'delete')
          .map(p => ({ permissionId: p.id })),
      },
    },
  });

  const waiterRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Waiter' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Waiter',
      description: 'Takes orders and serves customers',
      permissions: {
        create: permissions
          .filter(p => ['orders', 'tables', 'menu'].includes(p.module) && ['read', 'update'].includes(p.action))
          .map(p => ({ permissionId: p.id })),
      },
    },
  });

  const kitchenRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Kitchen Staff' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Kitchen Staff',
      description: 'Kitchen operations',
      permissions: {
        create: permissions
          .filter(p => ['orders', 'menu'].includes(p.module) && p.action === 'read')
          .map(p => ({ permissionId: p.id })),
      },
    },
  });
  console.log(`  ✅ Created roles: Owner, Manager, Waiter, Kitchen Staff`);

  // ─── Branch ───
  const branch = await prisma.branch.upsert({
    where: { id: 'existing-branch' },
    update: {},
    create: {
      id: 'existing-branch',
      tenantId: tenant.id,
      name: 'Main Branch - Koramangala',
      address: '45 Koramangala, Bangalore 560034',
      phone: '+919876543210',
      isPrimary: true,
    },
  });
  console.log(`  ✅ Created branch: ${branch.name}`);

  // ─── Categories ───
  const categoryMap: Record<string, string> = {};
  for (const cat of CATEGORIES_DATA) {
    const existing = await prisma.category.findFirst({
      where: { tenantId: tenant.id, name: cat.name },
    });
    if (existing) {
      categoryMap[cat.name] = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { tenantId: tenant.id, name: cat.name, sortOrder: cat.sortOrder },
      });
      categoryMap[cat.name] = created.id;
    }
  }
  console.log(`  ✅ Created ${CATEGORIES_DATA.length} categories`);

  // ─── Menu Items ───
  let itemCount = 0;
  for (const [catName, itemName, price] of MENU_ITEMS_DATA) {
    const categoryId = categoryMap[catName];
    if (!categoryId) continue;

    const existing = await prisma.menuItem.findFirst({
      where: { tenantId: tenant.id, name: itemName, categoryId },
    });
    if (existing) continue;

    await prisma.menuItem.create({
      data: {
        tenantId: tenant.id,
        categoryId,
        name: itemName,
        price,
        isVeg: isVegItem(catName, itemName),
        isAvailable: true,
        sortOrder: itemCount,
      },
    });
    itemCount++;
  }
  console.log(`  ✅ Created ${itemCount} menu items`);

  // ─── Tables ───
  const existingTables = await prisma.restaurantTable.count({ where: { branchId: branch.id } });
  if (existingTables === 0) {
    const tableData = [];
    for (let i = 1; i <= 10; i++) {
      tableData.push({
        branchId: branch.id,
        number: i,
        name: i <= 2 ? `VIP ${i}` : undefined,
        capacity: i <= 2 ? 8 : i <= 6 ? 4 : 2,
        status: 'FREE' as const,
      });
    }
    await prisma.restaurantTable.createMany({ data: tableData });
    console.log(`  ✅ Created 10 tables`);
  } else {
    console.log(`  ⏭️  Tables already exist (${existingTables})`);
  }

  // ─── Staff ───
  const existingStaff = await prisma.staff.count({ where: { branchId: branch.id } });
  if (existingStaff === 0) {
    await prisma.staff.createMany({
      data: [
        { branchId: branch.id, roleId: managerRole.id, name: 'Amit Sharma', phone: '+919876543211', pin: '1234' },
        { branchId: branch.id, roleId: waiterRole.id, name: 'Rahul Singh', phone: '+919876543212', pin: '5678' },
        { branchId: branch.id, roleId: waiterRole.id, name: 'Priya Patel', phone: '+919876543213', pin: '9012' },
        { branchId: branch.id, roleId: kitchenRole.id, name: 'Suresh Reddy', phone: '+919876543214', pin: '3456' },
      ],
    });
    console.log(`  ✅ Created 4 staff members`);
  } else {
    console.log(`  ⏭️  Staff already exist (${existingStaff})`);
  }

  // ─── Inventory Items ───
  const existingInventory = await prisma.inventoryItem.count({ where: { tenantId: tenant.id } });
  if (existingInventory === 0) {
    await prisma.inventoryItem.createMany({
      data: [
        { tenantId: tenant.id, name: 'Basmati Rice', unit: 'kg', currentStock: 50, minimumStock: 10, unitCost: 80 },
        { tenantId: tenant.id, name: 'Toor Dal', unit: 'kg', currentStock: 20, minimumStock: 5, unitCost: 120 },
        { tenantId: tenant.id, name: 'Sunflower Oil', unit: 'litre', currentStock: 30, minimumStock: 10, unitCost: 150 },
        { tenantId: tenant.id, name: 'Onion', unit: 'kg', currentStock: 25, minimumStock: 5, unitCost: 40 },
        { tenantId: tenant.id, name: 'Tomato', unit: 'kg', currentStock: 20, minimumStock: 5, unitCost: 50 },
        { tenantId: tenant.id, name: 'Potato', unit: 'kg', currentStock: 15, minimumStock: 5, unitCost: 35 },
        { tenantId: tenant.id, name: 'Paneer', unit: 'kg', currentStock: 8, minimumStock: 3, unitCost: 350 },
        { tenantId: tenant.id, name: 'Chicken (Whole)', unit: 'kg', currentStock: 15, minimumStock: 5, unitCost: 200 },
        { tenantId: tenant.id, name: 'Mutton', unit: 'kg', currentStock: 8, minimumStock: 3, unitCost: 600 },
        { tenantId: tenant.id, name: 'Eggs', unit: 'piece', currentStock: 100, minimumStock: 30, unitCost: 6 },
        { tenantId: tenant.id, name: 'Garam Masala', unit: 'kg', currentStock: 2, minimumStock: 0.5, unitCost: 500 },
        { tenantId: tenant.id, name: 'Turmeric Powder', unit: 'kg', currentStock: 1, minimumStock: 0.3, unitCost: 200 },
        { tenantId: tenant.id, name: 'Red Chilli Powder', unit: 'kg', currentStock: 2, minimumStock: 0.5, unitCost: 300 },
        { tenantId: tenant.id, name: 'Coriander Leaves', unit: 'kg', currentStock: 3, minimumStock: 1, unitCost: 80 },
        { tenantId: tenant.id, name: 'Mint Leaves', unit: 'kg', currentStock: 2, minimumStock: 0.5, unitCost: 60 },
        { tenantId: tenant.id, name: 'Ginger', unit: 'kg', currentStock: 3, minimumStock: 1, unitCost: 100 },
        { tenantId: tenant.id, name: 'Garlic', unit: 'kg', currentStock: 3, minimumStock: 1, unitCost: 80 },
        { tenantId: tenant.id, name: 'Curd', unit: 'kg', currentStock: 10, minimumStock: 3, unitCost: 60 },
        { tenantId: tenant.id, name: 'Butter', unit: 'kg', currentStock: 5, minimumStock: 2, unitCost: 400 },
        { tenantId: tenant.id, name: 'Naan Flour', unit: 'kg', currentStock: 15, minimumStock: 5, unitCost: 45 },
      ],
    });
    console.log(`  ✅ Created 20 inventory items`);
  } else {
    console.log(`  ⏭️  Inventory items already exist (${existingInventory})`);
  }

  const totalItems = await prisma.menuItem.count({ where: { tenantId: tenant.id } });
  const totalCategories = await prisma.category.count({ where: { tenantId: tenant.id } });

  console.log('\n🎉 Seed completed!');
  console.log(`   📂 ${totalCategories} categories | 🍽️  ${totalItems} menu items`);
  console.log('\n📋 Demo Credentials:');
  console.log('   Email:      admin@demo.com');
  console.log('   Password:   password123');
  console.log('   Restaurant: Hungry Island');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
