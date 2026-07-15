/**
 * API Layer — connects the customer web to the NexaROS backend.
 *
 * Architecture:
 *   1. api-client.ts – raw HTTP transport (auth headers, error types)
 *   2. api.ts         – domain methods + data transformers
 *   3. mock-data.ts   – static fallback for content features not on backend yet
 *
 * Data transformers map the lean backend response shapes to the
 * richer frontend types used across all pages.
 */
import { apiClient } from './api-client';
import {
  TENANT_INFO,
  OFFERS,
  TESTIMONIALS,
  TEAM_MEMBERS,
  BLOG_POSTS,
  EVENTS,
  GALLERY_IMAGES,
  FAQS,
  PROFILE_DATA,
  SAVED_ADDRESSES,
  SAVED_PAYMENTS,
  MOCK_ORDER_HISTORY,
  MOCK_REVIEWS,
  NOTIFICATIONS,
  MENU_ITEMS as MENU_ITEMS_RICH,
  MENU_CATEGORIES as MENU_ITEMS_RICH_CATEGORIES,
} from './data/mock-data';
import type {
  MenuItem,
  MenuCategory,
  Offer,
  Reservation,
  Order,
  Address,
  PaymentMethod,
  Review,
  UserProfile,
  BlogPost,
  Event,
  GalleryImage,
  FAQ,
  Testimonial,
  TeamMember,
  TenantInfo,
  MenuVariant,
  AddOn,
} from '@/types';
import { generateId } from './utils';

// ── Constants ──

/** Default tenant slug used when no slug is provided */
export const DEFAULT_TENANT_SLUG = 'spice-garden';

/** Current active tenant slug — set by pages that know the slug */
let currentTenantSlug = DEFAULT_TENANT_SLUG;

export function setCurrentTenantSlug(slug: string) {
  currentTenantSlug = slug;
}

export function getCurrentTenantSlug(): string {
  return currentTenantSlug;
}

// ── Cached menu data ──

interface MenuCache {
  tenant: TenantInfo;
  defaultBranch: { id: string; name: string } | null;
  categories: MenuCategory[];
  items: MenuItem[];
  totalItems: number;
  fetchedAt: number;
}

let menuCache: MenuCache | null = null;
const CACHE_TTL = 60_000; // 1 minute

function isCacheValid(): boolean {
  return !!menuCache && Date.now() - menuCache.fetchedAt < CACHE_TTL;
}

function invalidateMenuCache() {
  menuCache = null;
}

// ── Data Transformers ──

/** Map backend tenant shape to the richer frontend TenantInfo type */
function transformTenantInfo(
  backend: Record<string, unknown>,
  extra?: Partial<TenantInfo>,
): TenantInfo {
  return {
    id: (backend.id as string) || '',
    name: (backend.name as string) || '',
    slug: (backend.slug as string) || '',
    tagline: extra?.tagline || 'Where Every Meal Tells a Story',
    description: extra?.description || '',
    logo: (backend.logo as string) || '',
    // favicon not returned by backend
    coverImage:
      extra?.coverImage ||
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=800&fit=crop',
    phone: (backend.phone as string) || '',
    email: (backend.email as string) || '',
    address: (backend.address as string) || '',
    mapUrl: `https://maps.google.com/?q=${encodeURIComponent((backend.address as string) || '')}`,
    currency: (backend.currency as string) || 'INR',
    timezone: (backend.timezone as string) || 'Asia/Kolkata',
    language: 'en',
    cuisine: 'Indian',
    priceRange: '₹₹₹',
    rating: 4.7,
    reviewCount: 0,
    openingHours: { weekdays: '10:00 AM - 11:00 PM', weekends: '9:00 AM - 12:00 AM' },
    socialLinks: { instagram: '#', facebook: '#', twitter: '#', youtube: '#' },
    features: [],
    awards: [],
    isOpen: true,
    ...extra,
  };
}

/** Map a backend menu item to the richer frontend MenuItem type */
function transformMenuItem(
  item: Record<string, unknown>,
  categoryName: string,
  categoryId: string,
): MenuItem {
  return {
    id: (item.id as string) || '',
    name: (item.name as string) || '',
    description: (item.description as string) || '',
    price: Number(item.price) || 0,
    originalPrice: undefined,
    isVeg: (item.isVeg as boolean) || false,
    isVegan: false,
    isJain: false,
    isGlutenFree: false,
    isSpicy: false,
    isPopular: false,
    isNew: false,
    image: (item.image as string) || '',
    images: (item.image as string) ? [(item.image as string)] : [],
    category: categoryName,
    categoryId,
    tags: [],
    ingredients: [],
    nutrition: { calories: 0, protein: '0g', carbs: '0g', fat: '0g', fiber: '0g' },
    prepTime: (item.prepTimeMin as number) || 15,
    rating: 4.5,
    reviewCount: 0,
    variants: ((item.variants as Array<Record<string, unknown>>) || []).map(
      (v: Record<string, unknown>) => ({
        id: (v.id as string) || '',
        name: (v.name as string) || '',
        price: Number(v.price) || 0,
      }),
    ),
    addOns: ((item.addOns as Array<Record<string, unknown>>) || []).map(
      (a: Record<string, unknown>) => ({
        id: (a.id as string) || '',
        name: (a.name as string) || '',
        price: Number(a.price) || 0,
        isVeg: true,
      }),
    ),
    isAvailable: true,
    isBestSeller: false,
    isChefRecommendation: false,
    isTodaySpecial: false,
    isSeasonal: false,
  };
}

/** Transform the combined public menu response into our cache structure */
function transformMenuResponse(data: Record<string, unknown>): MenuCache {
  const backendTenant = (data.tenant as Record<string, unknown>) || {};
  const rawCategories = (data.categories as Array<Record<string, unknown>>) || [];
  const defaultBranch = data.defaultBranch as { id: string; name: string } | null;

  const tenant = transformTenantInfo(backendTenant);

  const categories: MenuCategory[] = rawCategories.map(
    (cat: Record<string, unknown>) => {
      const rawItems = (cat.items as Array<Record<string, unknown>>) || [];
      const catName = (cat.name as string) || '';
      const catId = (cat.id as string) || '';
      return {
        id: catId,
        name: catName,
        description: (cat.description as string) || '',
        image: '',
        itemCount: rawItems.length,
        icon: '🍽️',
        items: rawItems.map((item) => transformMenuItem(item, catName, catId)),
      };
    },
  );

  const allItems = categories.flatMap((c) => c.items || []);

  // TODO: Remove these heuristics once the backend stores isPopular, isBestSeller,
  // isChefRecommendation, isTodaySpecial, isNew, and isSeasonal flags and
  // the public menu endpoint returns them. Until then, we distribute items
  // across featured categories so the home page sections aren't empty.
  allItems.forEach((item, i) => {
    if (i < 8) item.isPopular = true;
    if (i >= 4 && i < 6) item.isBestSeller = true;   // items 4-5
    if (i < 3) item.isChefRecommendation = true;       // items 0-2
    if (i === 3) item.isTodaySpecial = true;            // item 3
    if (i >= 6 && i < 8) item.isNew = true;             // items 6-7
    if (i >= 1 && i <= 2) item.isSeasonal = true;       // items 1-2
  });

  return {
    tenant,
    defaultBranch: defaultBranch || null,
    categories,
    items: allItems,
    totalItems: allItems.length,
    fetchedAt: Date.now(),
  };
}

/** Map a backend order tracking response to the frontend Order type */
function transformTrackedOrder(data: Record<string, unknown>): Order {
  const rawItems = (data.items as Array<Record<string, unknown>>) || [];
  const rawHistory = (data.statusHistory as Array<Record<string, unknown>>) || [];
  const table = data.table as { number?: number } | null;

  return {
    id: (data.id as string) || '',
    orderNumber: (data.orderNumber as number) || 0,
    status: (data.status as Order['status']) || 'PENDING',
    type: (data.type as Order['type']) || 'DINE_IN',
    items: rawItems.map((i, idx) => ({
      id: `oi_${idx}`,
      name: (i.name as string) || '',
      quantity: (i.quantity as number) || 1,
      unitPrice: 0,
      totalPrice: 0,
      status: (i.status as string) || 'PENDING',
      image: '',
      isVeg: true,
      addOns: [],
      instructions: '',
    })),
    totalAmount: Number(data.totalAmount) || 0,
    subtotal: Number(data.totalAmount) || 0,
    deliveryCharge: 0,
    packagingCharge: 0,
    tip: 0,
    discount: 0,
    tax: 0,
    customerName: (data.customerName as string) || '',
    customerPhone: '',
    customerEmail: '',
    instructions: '',
    estimatedMinutes: (data.estimatedMinutes as number) || 0,
    statusHistory: rawHistory.map((h) => ({
      status: (h.status as string) || '',
      label: statusLabel((h.status as string) || ''),
      notes: (h.notes as string) || '',
      createdAt: (h.createdAt as string) || '',
    })),
    createdAt: (data.createdAt as string) || '',
    updatedAt: (data.updatedAt as string) || '',
    tableNumber: table?.number,
  };
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Order Placed',
    CONFIRMED: 'Confirmed',
    PREPARING: 'Being Prepared',
    READY: 'Ready to Serve',
    SERVED: 'Served',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DELIVERED: 'Delivered',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    COOKING: 'Cooking',
    PACKED: 'Packed',
  };
  return labels[status] || status;
}

// ── API Methods ──

export const api = {
  // ── Tenant / Restaurant Info ──

  async getTenantInfo(slug?: string): Promise<TenantInfo> {
    const s = slug || currentTenantSlug;
    try {
      const data = await apiClient.get<Record<string, unknown>>(`public/tenant/${s}`);
      return transformTenantInfo(data);
    } catch {
      // Fallback to mock
      return { ...TENANT_INFO };
    }
  },

  // ── Menu ──

  /**
   * Fetch and cache the full menu from the backend.
   * Subsequent calls use the cache until TTL expires.
   */
  async fetchFullMenu(slug?: string): Promise<MenuCache> {
    if (isCacheValid()) {
      return menuCache!;
    }

    const s = slug || currentTenantSlug;
    try {
      const data = await apiClient.get<Record<string, unknown>>(`public/menu/${s}`);
      menuCache = transformMenuResponse(data);
      return menuCache;
    } catch {
      // Fallback: use mock data
      const mockCategories = [...MENU_ITEMS_RICH_CATEGORIES];
      const mockItems = [...MENU_ITEMS_RICH]; // from mock-data
      menuCache = {
        tenant: { ...TENANT_INFO },
        defaultBranch: { id: 'branch_1', name: 'Main Branch' },
        categories: mockCategories.map((c) => ({
          ...c,
          items: mockItems.filter((i) => i.categoryId === c.id),
        })),
        items: mockItems,
        totalItems: mockItems.length,
        fetchedAt: Date.now(),
      };
      return menuCache;
    }
  },

  async getMenuCategories(): Promise<MenuCategory[]> {
    const cache = await api.fetchFullMenu();
    return cache.categories;
  },

  async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    const cache = await api.fetchFullMenu();
    if (categoryId) {
      const cat = cache.categories.find((c) => c.id === categoryId);
      return cat?.items || [];
    }
    return cache.items;
  },

  async getMenuItem(slug: string): Promise<MenuItem | null> {
    const cache = await api.fetchFullMenu();
    // Try matching by slugified name
    const item = cache.items.find(
      (i) => i.name.toLowerCase().replace(/\s+/g, '-') === slug,
    );
    return item || null;
  },

  async searchMenu(query: string): Promise<MenuItem[]> {
    const cache = await api.fetchFullMenu();
    const q = query.toLowerCase();
    return cache.items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)),
    );
  },

  async getPopularItems(): Promise<MenuItem[]> {
    const items = await api.getMenuItems();
    return items.filter((item) => item.isPopular).slice(0, 8);
  },

  async getBestSellers(): Promise<MenuItem[]> {
    const items = await api.getMenuItems();
    return items.filter((item) => item.isBestSeller).slice(0, 8);
  },

  async getChefRecommendations(): Promise<MenuItem[]> {
    const items = await api.getMenuItems();
    return items.filter((item) => item.isChefRecommendation).slice(0, 6);
  },

  async getTodaySpecials(): Promise<MenuItem[]> {
    const items = await api.getMenuItems();
    return items.filter((item) => item.isTodaySpecial);
  },

  async getSeasonalItems(): Promise<MenuItem[]> {
    const items = await api.getMenuItems();
    return items.filter((item) => item.isSeasonal);
  },

  async getNewItems(): Promise<MenuItem[]> {
    const items = await api.getMenuItems();
    return items.filter((item) => item.isNew);
  },

  // ── Offers & Coupons ──

  async getOffers(): Promise<Offer[]> {
    return [...OFFERS];
  },

  async validateCoupon(code: string): Promise<Offer | null> {
    // Try the backend endpoint first
    try {
      const result = await apiClient.post<{ valid: boolean; coupon?: Record<string, unknown> }>(
        'coupons/validate',
        { code, tenantId: TENANT_INFO.id },
      );
      if (result.valid && result.coupon) {
        const c = result.coupon;
        return {
          id: (c.id as string) || '',
          title: (c.description as string) || code,
          description: (c.description as string) || '',
          code: code.toUpperCase(),
          discountType: ((c.type as string) === 'PERCENTAGE' ? 'percentage' : 'flat') as 'percentage' | 'flat',
          discountValue: Number(c.value) || 0,
          minOrder: Number(c.minPlanPrice) || 0,
          maxDiscount: Number(c.maxDiscount) || Number(c.value) || 0,
          validFrom: '',
          validTo: (c.expiry as string) || '',
          isActive: (c.isActive as boolean) ?? true,
          image: '',
          terms: [],
          type: 'coupon',
        };
      }
      return null;
    } catch {
      // Fallback to mock
      return OFFERS.find((o) => o.code === code.toUpperCase() && o.isActive) || null;
    }
  },

  // ── Orders ──

  async createOrder(data: {
    items: { menuItemId: string; name: string; quantity: number; unitPrice: number }[];
    type: string;
    branchId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    deliveryAddressId?: string;
    instructions?: string;
    couponCode?: string;
    tip?: number;
    packagingPreference?: string;
  }): Promise<Order> {
    try {
      const cache = menuCache;
      const branchId =
        data.branchId ||
        cache?.defaultBranch?.id ||
        'branch_1';

      const payload: Record<string, unknown> = {
        branchId,
        type: data.type === 'DINE_IN' ? 'DINE_IN' : data.type === 'TAKEAWAY' ? 'TAKEAWAY' : 'DELIVERY',
        items: data.items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: data.instructions || undefined,
        })),
      };

      if (data.customerName) payload.customerName = data.customerName;
      if (data.customerPhone) payload.customerPhone = data.customerPhone;

      const result = await apiClient.post<Record<string, unknown>>('public/orders', payload);

      const totalAmount = Number(result.totalAmount) || data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

      // Map backend response to frontend Order type
      return {
        id: (result.id as string) || `ord_${generateId()}`,
        orderNumber: (result.orderNumber as number) || Math.floor(1200 + Math.random() * 300),
        status: (result.status as Order['status']) || 'PENDING',
        type: (data.type as Order['type']) || 'DELIVERY',
        items: data.items.map((i, idx) => ({
          id: `oi_${idx}`,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.unitPrice * i.quantity,
          status: 'PENDING',
          image: '',
          isVeg: true,
          addOns: [],
          instructions: data.instructions || '',
        })),
        totalAmount,
        subtotal: totalAmount,
        deliveryCharge: 40,
        packagingCharge: 10,
        tip: data.tip || 0,
        discount: 0,
        tax: Math.round(totalAmount * 0.05),
        couponCode: data.couponCode,
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        customerEmail: data.customerEmail || '',
        instructions: data.instructions || '',
        estimatedMinutes: 30,
        statusHistory: [
          {
            status: 'PENDING',
            label: 'Order Placed',
            notes: 'Your order has been received',
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Fallback to mock order
      const totalAmount = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      return {
        id: 'ord_' + generateId(),
        orderNumber: Math.floor(1200 + Math.random() * 300),
        status: 'PENDING',
        type: (data.type as Order['type']) || 'DELIVERY',
        items: data.items.map((i, idx) => ({
          id: 'oi_' + idx,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.unitPrice * i.quantity,
          status: 'PENDING',
          image: '',
          isVeg: true,
          addOns: [],
          instructions: data.instructions || '',
        })),
        totalAmount,
        subtotal: totalAmount,
        deliveryCharge: 40,
        packagingCharge: 10,
        tip: data.tip || 0,
        discount: 0,
        tax: Math.round(totalAmount * 0.05),
        couponCode: data.couponCode,
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        customerEmail: data.customerEmail || '',
        instructions: data.instructions || '',
        estimatedMinutes: 30,
        statusHistory: [
          {
            status: 'PENDING',
            label: 'Order Placed',
            notes: 'Your order has been received',
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const data = await apiClient.get<Record<string, unknown>>(`public/orders/${orderId}/track`);
      return transformTrackedOrder(data);
    } catch {
      // Fallback to mock
      const order = MOCK_ORDER_HISTORY.find((o) => o.id === orderId);
      if (order) return { ...order };
      return null;
    }
  },

  async getOrderHistory(): Promise<Order[]> {
    return [...MOCK_ORDER_HISTORY];
  },

  async trackOrder(orderId: string): Promise<Order | null> {
    return api.getOrder(orderId);
  },

  // ── Reservations ──

  async createReservation(data: {
    date: string;
    time: string;
    guestCount: number;
    occasion?: string;
    specialRequests?: string;
  }): Promise<Reservation> {
    // No public reservation endpoint yet — use mock
    await delay(500);
    return {
      id: 'res_' + generateId(),
      date: data.date,
      time: data.time,
      guestCount: data.guestCount,
      occasion: data.occasion || '',
      specialRequests: data.specialRequests || '',
      status: 'confirmed',
      tableNumber: Math.floor(Math.random() * 30) + 1,
      deposit: 0,
      qrCode:
        'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=spice-garden-reservation',
      createdAt: new Date().toISOString(),
    };
  },

  async getAvailableSlots(_date: string): Promise<string[]> {
    await delay();
    const slots: string[] = [];
    for (let h = 11; h <= 22; h++) {
      const hour = h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      slots.push(`${hour}:00 ${ampm}`);
      if (h !== 22) slots.push(`${hour}:30 ${ampm}`);
    }
    return slots;
  },

  // ── Profile ──

  async getProfile(): Promise<UserProfile> {
    try {
      const data = await apiClient.get<Record<string, unknown>>('auth/profile');
      return {
        id: (data.id as string) || '',
        name: `${(data.firstName as string) || ''} ${(data.lastName as string) || ''}`.trim(),
        email: (data.email as string) || '',
        phone: (data.phone as string) || '',
        avatar: (data.avatar as string) || '',
        dob: '',
        anniversary: '',
        preferences: {
          darkMode: false,
          language: 'en',
          notifications: { email: true, sms: true, push: true, offers: true },
          dietaryPreferences: [],
          allergies: [],
        },
        loyaltyPoints: 0,
        loyaltyTier: 'bronze',
        membershipSince: (data.createdAt as string)?.split('T')[0] || '',
        totalOrders: 0,
        totalSpent: 0,
      };
    } catch {
      return { ...PROFILE_DATA };
    }
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    await delay();
    return { ...PROFILE_DATA, ...data };
  },

  async getAddresses(): Promise<Address[]> {
    return [...SAVED_ADDRESSES];
  },

  async getPayments(): Promise<PaymentMethod[]> {
    return [...SAVED_PAYMENTS];
  },

  async getReviews(): Promise<Review[]> {
    return [...MOCK_REVIEWS];
  },

  // ── Content (all mock-based for now) ──

  async getBlogPosts(): Promise<BlogPost[]> {
    return [...BLOG_POSTS];
  },

  async getBlogPost(slug: string): Promise<BlogPost | null> {
    return BLOG_POSTS.find((p) => p.slug === slug) || null;
  },

  async getEvents(): Promise<Event[]> {
    return [...EVENTS];
  },

  async getEvent(id: string): Promise<Event | null> {
    return EVENTS.find((e) => e.id === id) || null;
  },

  async getGalleryImages(): Promise<GalleryImage[]> {
    return [...GALLERY_IMAGES];
  },

  async getFAQs(): Promise<FAQ[]> {
    return [...FAQS];
  },

  async getTestimonials(): Promise<Testimonial[]> {
    return [...TESTIMONIALS];
  },

  async getTeamMembers(): Promise<TeamMember[]> {
    return [...TEAM_MEMBERS];
  },

  async getNotifications(): Promise<typeof NOTIFICATIONS> {
    return [...NOTIFICATIONS];
  },
};

// ── Re-export legacy helpers ──

export const trackOrder = async (orderId: string) => api.trackOrder(orderId);

export const createOrder = async (data: {
  branchId?: string;
  tableId?: string;
  items: { menuItemId: string; name: string; quantity: number; unitPrice: number }[];
  type: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddressId?: string;
  instructions?: string;
  couponCode?: string;
  tip?: number;
  packagingPreference?: string;
}) => {
  return api.createOrder(data);
};

export const getTenantBySlug = async (slug: string) => {
  return api.getTenantInfo(slug);
};

export const getTenantMenu = async (slug?: string) => {
  const cache = await api.fetchFullMenu(slug);
  return {
    tenant: cache.tenant,
    defaultBranch: cache.defaultBranch,
    categories: cache.categories.map((c) => ({
      ...c,
      items: c.items || [],
    })),
    totalItems: cache.totalItems,
  };
};

export const scanTableQr = async (qrCode: string) => {
  try {
    const data = await apiClient.get<Record<string, unknown>>(`public/table/scan/${qrCode}`);
    return {
      tableId: (data.tableId as string) || '',
      tableNumber: (data.tableNumber as number) || 0,
      branchId: (data.branchId as string) || '',
      branchName: (data.branchName as string) || '',
      tenantSlug: (data.tenantSlug as string) || '',
      tenantName: (data.tenantName as string) || '',
      currency: (data.currency as string) || 'INR',
    };
  } catch {
    return {
      tableId: 'table_12',
      tableNumber: 12,
      branchId: 'branch_1',
      branchName: 'Main Branch',
      tenantSlug: 'spice-garden',
      tenantName: 'Spice Garden',
      currency: 'INR',
    };
  }
};

// ── Helpers ──

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}



export type {
  MenuItem,
  MenuCategory,
  Offer,
  Reservation,
  Order,
  Address,
  PaymentMethod,
  Review,
  UserProfile,
  BlogPost,
  Event,
  GalleryImage,
  FAQ,
  Testimonial,
  TeamMember,
  OrderItem,
  StatusHistoryEntry,
  DeliveryDriver,
  CartItem,
  MenuVariant,
  AddOn,
} from '@/types';

export type { TenantInfo } from '@/types';
