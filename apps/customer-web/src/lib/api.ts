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
} from '@/types';
import {
  MENU_ITEMS,
  MENU_CATEGORIES,
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
  TENANT_INFO,
} from '@/lib/data/mock-data';
import { generateId } from '@/lib/utils';

interface LegacyOrderInput {
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
}

// Simulated network delay
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// API Client with mock data
export const api = {
  // Tenant / Restaurant Info
  async getTenantInfo() {
    await delay();
    return { ...TENANT_INFO };
  },

  // Menu
  async getMenuCategories(): Promise<MenuCategory[]> {
    await delay();
    return [...MENU_CATEGORIES];
  },

  async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    await delay(200);
    if (categoryId) {
      return MENU_ITEMS.filter((item) => item.categoryId === categoryId);
    }
    return [...MENU_ITEMS];
  },

  async getMenuItem(slug: string): Promise<MenuItem | null> {
    await delay(200);
    return MENU_ITEMS.find(
      (item) => item.name.toLowerCase().replace(/\s+/g, '-') === slug
    ) || null;
  },

  async searchMenu(query: string): Promise<MenuItem[]> {
    await delay(150);
    const q = query.toLowerCase();
    return MENU_ITEMS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q)) ||
        item.ingredients.some((i) => i.toLowerCase().includes(q))
    );
  },

  async getPopularItems(): Promise<MenuItem[]> {
    await delay();
    return MENU_ITEMS.filter((item) => item.isPopular).slice(0, 8);
  },

  async getBestSellers(): Promise<MenuItem[]> {
    await delay();
    return MENU_ITEMS.filter((item) => item.isBestSeller).slice(0, 8);
  },

  async getChefRecommendations(): Promise<MenuItem[]> {
    await delay();
    return MENU_ITEMS.filter((item) => item.isChefRecommendation).slice(0, 6);
  },

  async getTodaySpecials(): Promise<MenuItem[]> {
    await delay();
    return MENU_ITEMS.filter((item) => item.isTodaySpecial);
  },

  async getSeasonalItems(): Promise<MenuItem[]> {
    await delay();
    return MENU_ITEMS.filter((item) => item.isSeasonal);
  },

  async getNewItems(): Promise<MenuItem[]> {
    await delay();
    return MENU_ITEMS.filter((item) => item.isNew);
  },

  // Offers
  async getOffers(): Promise<Offer[]> {
    await delay();
    return [...OFFERS];
  },

  async validateCoupon(code: string): Promise<Offer | null> {
    await delay(300);
    return OFFERS.find(
      (o) => o.code === code.toUpperCase() && o.isActive
    ) || null;
  },

  // Orders
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
    await delay(500);
    const totalAmount = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const order: Order = {
      id: 'ord_' + generateId(),
      orderNumber: Math.floor(1200 + Math.random() * 300),
      status: 'PENDING',
      type: data.type as any,
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
    return order;
  },

  async getOrder(orderId: string): Promise<Order | null> {
    await delay();
    const order = MOCK_ORDER_HISTORY.find((o) => o.id === orderId);
    if (order) return { ...order };
    // Return a mock active order
    return {
      id: orderId,
      orderNumber: 1247,
      status: 'PREPARING',
      type: 'DELIVERY',
      items: [
        { id: 'oi_1', name: 'Butter Chicken', quantity: 1, unitPrice: 399, totalPrice: 399, status: 'PREPARING', image: '', isVeg: false, addOns: [], instructions: '' },
        { id: 'oi_2', name: 'Garlic Naan', quantity: 3, unitPrice: 59, totalPrice: 177, status: 'COMPLETED', image: '', isVeg: true, addOns: [], instructions: '' },
      ],
      totalAmount: 576,
      subtotal: 576,
      deliveryCharge: 0,
      packagingCharge: 10,
      tip: 30,
      discount: 0,
      tax: 29,
      customerName: 'Guest',
      customerPhone: '',
      customerEmail: '',
      instructions: '',
      estimatedMinutes: 20,
      statusHistory: [
        { status: 'PENDING', label: 'Order Placed', notes: '', createdAt: new Date(Date.now() - 1200000).toISOString() },
        { status: 'CONFIRMED', label: 'Confirmed', notes: '', createdAt: new Date(Date.now() - 900000).toISOString() },
        { status: 'PREPARING', label: 'Preparing', notes: 'Being prepared by Chef Vikram', createdAt: new Date(Date.now() - 300000).toISOString() },
      ],
      createdAt: new Date(Date.now() - 1200000).toISOString(),
      updatedAt: new Date().toISOString(),
      driver: {
        name: 'Ravi Kumar',
        phone: '+91 99887 76655',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        rating: 4.8,
        vehicleNumber: 'KA-01-MX-4521',
        eta: 20,
        lat: 12.9716,
        lng: 77.6412,
      },
    };
  },

  async getOrderHistory(): Promise<Order[]> {
    await delay();
    return [...MOCK_ORDER_HISTORY];
  },

  async trackOrder(orderId: string) {
    return this.getOrder(orderId);
  },

  // Reservations
  async createReservation(data: {
    date: string;
    time: string;
    guestCount: number;
    occasion?: string;
    specialRequests?: string;
  }): Promise<Reservation> {
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
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=spice-garden-reservation',
      createdAt: new Date().toISOString(),
    };
  },

  async getAvailableSlots(date: string): Promise<string[]> {
    await delay();
    const slots = [];
    for (let h = 11; h <= 22; h++) {
      const hour = h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      slots.push(`${hour}:00 ${ampm}`);
      if (h !== 22) slots.push(`${hour}:30 ${ampm}`);
    }
    return slots;
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    await delay();
    return { ...PROFILE_DATA };
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    await delay();
    return { ...PROFILE_DATA, ...data };
  },

  async getAddresses(): Promise<Address[]> {
    await delay();
    return [...SAVED_ADDRESSES];
  },

  async getPayments(): Promise<PaymentMethod[]> {
    await delay();
    return [...SAVED_PAYMENTS];
  },

  async getReviews(): Promise<Review[]> {
    await delay();
    return [...MOCK_REVIEWS];
  },

  // Content
  async getBlogPosts(): Promise<BlogPost[]> {
    await delay();
    return [...BLOG_POSTS];
  },

  async getBlogPost(slug: string): Promise<BlogPost | null> {
    await delay();
    return BLOG_POSTS.find((p) => p.slug === slug) || null;
  },

  async getEvents(): Promise<Event[]> {
    await delay();
    return [...EVENTS];
  },

  async getEvent(id: string): Promise<Event | null> {
    await delay();
    return EVENTS.find((e) => e.id === id) || null;
  },

  async getGalleryImages(): Promise<GalleryImage[]> {
    await delay();
    return [...GALLERY_IMAGES];
  },

  async getFAQs(): Promise<FAQ[]> {
    await delay();
    return [...FAQS];
  },

  async getTestimonials(): Promise<Testimonial[]> {
    await delay();
    return [...TESTIMONIALS];
  },

  async getTeamMembers(): Promise<TeamMember[]> {
    await delay();
    return [...TEAM_MEMBERS];
  },

  async getNotifications(): Promise<typeof NOTIFICATIONS> {
    await delay();
    return [...NOTIFICATIONS];
  },
};

// Re-export legacy API functions
export const trackOrder = async (orderId: string) => api.trackOrder(orderId);
export const createOrder = async (data: LegacyOrderInput) => {
  return api.createOrder({
    items: data.items,
    type: data.type,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    deliveryAddressId: data.deliveryAddressId,
    instructions: data.instructions,
    couponCode: data.couponCode,
    tip: data.tip,
    packagingPreference: data.packagingPreference,
  });
};
export const getTenantBySlug = api.getTenantInfo;
export const getTenantMenu = async (_slug?: string) => ({
  tenant: TENANT_INFO,
  defaultBranch: { id: 'branch_1', name: 'Main Branch' },
  categories: MENU_CATEGORIES.map((c) => ({
    ...c,
    items: MENU_ITEMS.filter((i) => i.categoryId === c.id),
  })),
  totalItems: MENU_ITEMS.length,
});
export const scanTableQr = async (_tableId?: string) => ({
  tableId: 'table_12',
  tableNumber: 12,
  branchId: 'branch_1',
  branchName: 'Main Branch',
  tenantSlug: 'spice-garden',
  tenantName: 'Spice Garden',
  currency: 'INR',
});

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
