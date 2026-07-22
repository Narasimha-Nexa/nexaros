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

/** Resolve tenant slug from hostname (for *.nexaros.in subdomain routing) */
function detectSubdomainFromHostname(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  // Match pattern: {subdomain}.nexaros.in or {subdomain}.localhost
  const match = hostname.match(/^([a-z0-9-]+)\.(nexaros\.in|localhost)$/);
  if (match) return match[1];
  return null;
}

export function setCurrentTenantSlug(slug: string) {
  currentTenantSlug = slug;
}

export function getCurrentTenantSlug(): string {
  return currentTenantSlug;
}

/** Auto-detect subdomain from browser hostname and set current tenant slug */
export async function initTenantFromSubdomain(): Promise<boolean> {
  const subdomain = detectSubdomainFromHostname();
  if (!subdomain) return false;
  try {
    const data = await apiClient.get<any>(`public/tenant/subdomain/${subdomain}`);
    if (data?.slug) {
      currentTenantSlug = data.slug;
      return true;
    }
  } catch {
    // Subdomain not found — fall back to default
  }
  return false;
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

/**
 * Invalidate the menu cache so the next fetchFullMenu call will
 * hit the backend instead of serving stale data.
 * This is called automatically when the WebSocket receives a menu:updated event.
 */
export function invalidateMenuCache() {
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
    const data = await apiClient.get<Record<string, unknown>>(`public/tenant/${s}`);
    return transformTenantInfo(data);
  },

  async getWebsiteConfig(slug?: string): Promise<any> {
    const s = slug || currentTenantSlug;
    try {
      return await apiClient.get<any>(`public/website/${s}`);
    } catch {
      return null;
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
      // Graceful empty-state fallback when the menu API is unavailable.
      menuCache = {
        tenant: {
          id: '', name: '', slug: s, tagline: '', description: '', logo: '', coverImage: '',
          cuisine: [], address: '', city: '', state: '', country: '', phone: '', email: '', gstin: '',
          isOpen: false, openingHours: { weekdays: '09:00-22:00', weekends: '09:00-23:00' }, social: {},
        } as any,
        defaultBranch: { id: '', name: '' },
        categories: [],
        items: [],
        totalItems: 0,
        fetchedAt: Date.now(),
      };
      return menuCache as MenuCache;
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
    try {
      const slug = getCurrentTenantSlug();
      const data = await apiClient.get<Offer[]>(`public/offers/${slug}`);
      return data || [];
    } catch {
      return [];
    }
  },

  async validateCoupon(code: string): Promise<Offer | null> {
    try {
      const slug = getCurrentTenantSlug();
      const result = await apiClient.get<{
        valid: boolean;
        code: string;
        type: string;
        value: number;
        maxDiscount: number | null;
        discount: number;
        festivalTag: string | null;
      }>(`public/coupons/${slug}/validate`, { code });
      if (result.valid) {
        return {
          id: '',
          title: result.festivalTag || code,
          description: `${result.type === 'PERCENTAGE' ? result.value + '%' : '₹' + result.value} off`,
          code: result.code,
          discountType: (result.type === 'PERCENTAGE' ? 'percentage' : 'flat') as 'percentage' | 'flat',
          discountValue: result.value,
          minOrder: 0,
          maxDiscount: result.maxDiscount || result.value,
          validFrom: '',
          validTo: '',
          isActive: true,
          image: '',
          terms: [],
          type: 'coupon',
        };
      }
      return null;
    } catch {
      return null;
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
    paymentMethod?: string;
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
      throw error;
    }
  },

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const data = await apiClient.get<Record<string, unknown>>(`public/orders/${orderId}/track`);
      return transformTrackedOrder(data);
    } catch {
      return null;
    }
  },

  async getOrderHistory(): Promise<Order[]> {
    try {
      const slug = getCurrentTenantSlug();
      const data = await apiClient.get<Order[]>(`public/orders/${slug}/history`);
      return data || [];
    } catch {
      return [];
    }
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
    try {
      const slug = getCurrentTenantSlug();
      const result = await apiClient.post<any>(`public/reservations/${slug}`, {
        customerName: 'Customer',
        customerPhone: '',
        date: data.date,
        time: data.time,
        guestCount: data.guestCount,
        occasion: data.occasion,
        specialRequests: data.specialRequests,
      });
      return {
        id: result.id,
        date: result.date,
        time: result.time,
        guestCount: result.guestCount,
        occasion: data.occasion || '',
        specialRequests: data.specialRequests || '',
        status: result.status || 'confirmed',
        tableNumber: result.tableNumber || 0,
        deposit: 0,
        qrCode: '',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },

  async getAvailableSlots(date: string): Promise<string[]> {
    try {
      const slug = getCurrentTenantSlug();
      const result = await apiClient.get<string[]>(`public/reservations/${slug}/slots?date=${date}`);
      return result || [];
    } catch {
      await delay();
      const slots: string[] = [];
      for (let h = 11; h <= 22; h++) {
        const hour = h > 12 ? h - 12 : h;
        const ampm = h < 12 ? 'AM' : 'PM';
        slots.push(`${hour}:00 ${ampm}`);
        if (h !== 22) slots.push(`${hour}:30 ${ampm}`);
      }
      return slots;
    }
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
      return {
        id: '',
        name: '',
        email: '',
        phone: '',
        avatar: '',
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
        membershipSince: '',
        totalOrders: 0,
        totalSpent: 0,
      };
    }
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const result = await apiClient.patch<UserProfile>('auth/profile', data);
    return result;
  },

  async getAddresses(): Promise<Address[]> {
    try {
      const data = await apiClient.get<Address[]>('auth/addresses');
      return data || [];
    } catch {
      return [];
    }
  },

  async getPayments(): Promise<PaymentMethod[]> {
    try {
      const data = await apiClient.get<PaymentMethod[]>('auth/payments');
      return data || [];
    } catch {
      return [];
    }
  },

  async getReviews(): Promise<Review[]> {
    try {
      const slug = getCurrentTenantSlug();
      const data = await apiClient.get<Review[]>(`public/reviews/${slug}`);
      return data || [];
    } catch {
      return [];
    }
  },

  // ── Content (try API first, fallback to mock) ──

  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const slug = getCurrentTenantSlug();
      const data = await apiClient.get<any[]>(`public/cms/${slug}/blog`);
      if (data && data.length > 0) return data.map((p: any) => ({
        id: p.id || p.slug, slug: p.slug, title: p.title,
        excerpt: p.excerpt || p.description || "", content: p.content || "",
        image: p.image || "", author: p.author || "Admin",
        category: p.category || "General",
        tags: p.tags || [], publishedAt: p.publishedAt || p.createdAt || new Date().toISOString(),
        readTime: p.readTime || 5, featured: p.featured || false,
      })) as BlogPost[];
    } catch {}
    return [];
  },

  async getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
      const tenantSlug = getCurrentTenantSlug();
      const p = await apiClient.get<any>(`public/cms/${tenantSlug}/blog/${slug}`);
      if (p) return {
        id: p.id || p.slug, slug: p.slug, title: p.title,
        excerpt: p.excerpt || p.description || "", content: p.content || "",
        image: p.image || "", author: p.author || "Admin",
        category: p.category || "General",
        tags: p.tags || [], publishedAt: p.publishedAt || p.createdAt || new Date().toISOString(),
        readTime: p.readTime || 5, featured: p.featured || false,
      } as unknown as BlogPost;
    } catch {}
    return null;
  },

  async getEvents(): Promise<Event[]> {
    try {
      const slug = getCurrentTenantSlug();
      const data = await apiClient.get<any[]>(`public/cms/${slug}/events`);
      if (data && data.length > 0) return data.map((e: any) => ({
        id: e.id, title: e.title, description: e.description || "",
        image: e.image || "", date: e.date || new Date().toISOString(),
        time: e.time || "", location: e.location || "",
        category: e.category || "special", price: e.price || 0,
        capacity: e.capacity || 0, attendees: e.attendees || 0,
        featured: e.featured || false, status: e.status || "upcoming",
      })) as unknown as Event[];
    } catch {}
    return [];
  },

  async getEvent(id: string): Promise<Event | null> {
    try {
      const slug = getCurrentTenantSlug();
      const e = await apiClient.get<any>(`public/cms/${slug}/events/${id}`);
      if (e) return {
        id: e.id, title: e.title, description: e.description || "",
        image: e.image || "", date: e.date || new Date().toISOString(),
        time: e.time || "", location: e.location || "",
        category: e.category || "special", price: e.price || 0,
        capacity: e.capacity || 0, attendees: e.attendees || 0,
        featured: e.featured || false, status: e.status || "upcoming",
      } as unknown as Event;
    } catch {}
    return null;
  },

  async getGalleryImages(): Promise<GalleryImage[]> {
    try {
      const slug = getCurrentTenantSlug();
      const data = await apiClient.get<any[]>(`public/cms/${slug}/gallery`);
      if (data && data.length > 0) return data.map((img: any) => ({
        id: img.id, url: img.url, alt: img.alt || "",
        category: img.category || "food", caption: img.caption || "",
        featured: img.featured || false,
      })) as unknown as GalleryImage[];
    } catch {}
    return [];
  },

  async getFAQs(): Promise<FAQ[]> {
    try {
      const slug = getCurrentTenantSlug();
      const data = await apiClient.get<any[]>(`public/cms/${slug}/faqs`);
      if (data && data.length > 0) return data.map((f: any) => ({
        id: f.id, question: f.question, answer: f.answer,
        category: f.category || "General", sortOrder: f.sortOrder || 0,
      })) as unknown as FAQ[];
    } catch {}
    return [];
  },

  async getTestimonials(): Promise<Testimonial[]> {
    try {
      const slug = getCurrentTenantSlug();
      const data = await apiClient.get<any[]>(`public/cms/${slug}/testimonials`);
      if (data && data.length > 0) return data.map((t: any) => ({
        id: t.id, name: t.name, avatar: t.avatar || "",
        rating: t.rating || 5, text: t.text || t.content || "",
        date: t.date || t.createdAt || "", source: t.source || "",
      })) as unknown as Testimonial[];
    } catch {}
    return [];
  },

  async getTeamMembers(): Promise<TeamMember[]> {
    return [];
  },

  async getNotifications(): Promise<Notification[]> {
    try {
      const data = await apiClient.get<Notification[]>('auth/notifications');
      return data || [];
    } catch {
      return [];
    }
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
  paymentMethod?: string;
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

// ── Dining Sessions (Shared Table Ordering) ──

export const diningApi = {
  scanQr: (qrCode: string) =>
    apiClient.get<any>(`public/dining/qr/${qrCode}`),

  joinSession: (sessionId: string, data: {
    guestToken: string;
    guestName?: string;
    guestNumber?: number;
    avatarColor?: string;
    deviceFingerprint?: string;
  }) => apiClient.post<any>(`public/dining/sessions/${sessionId}/join`, data),

  getGuestSession: (guestToken: string) =>
    apiClient.get<any>(`public/dining/guest/${guestToken}`),

  updateGuestProfile: (guestToken: string, data: { guestName?: string; avatarColor?: string }) =>
    apiClient.patch<any>(`public/dining/guest/${guestToken}/profile`, data),

  touchActivity: (guestToken: string) =>
    apiClient.patch<any>(`public/dining/guest/${guestToken}/touch`),

  getCart: (guestSessionId: string) =>
    apiClient.get<any>(`public/dining/guest/${guestSessionId}/cart`),

  addToCart: (guestSessionId: string, item: {
    menuItemId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    variantId?: string;
    notes?: string;
  }) => apiClient.post<any>(`public/dining/guest/${guestSessionId}/cart`, item),

  updateCartItem: (guestSessionId: string, cartItemId: string, data: { quantity?: number; notes?: string }) =>
    apiClient.patch<any>(`public/dining/guest/${guestSessionId}/cart/${cartItemId}`, data),

  removeFromCart: (guestSessionId: string, cartItemId: string) =>
    apiClient.patch<any>(`public/dining/guest/${guestSessionId}/cart/${cartItemId}/remove`),

  placeOrder: (guestSessionId: string) =>
    apiClient.post<any>(`public/dining/guest/${guestSessionId}/order`),

  getSession: (sessionId: string) =>
    apiClient.get<any>(`public/dining/sessions/${sessionId}`),

  getBill: (sessionId: string) =>
    apiClient.get<any>(`public/dining/sessions/${sessionId}/bill`),

  getSharedItems: (sessionId: string) =>
    apiClient.get<any>(`public/dining/sessions/${sessionId}/shared`),

  payGuestShare: (sessionId: string, data: {
    guestSessionId: string;
    method: string;
    amount: number;
    reference?: string;
  }) => apiClient.post<any>(`public/dining/sessions/${sessionId}/pay`, data),
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
