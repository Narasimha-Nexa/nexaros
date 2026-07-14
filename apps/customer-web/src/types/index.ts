export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  isVeg: boolean;
  isVegan: boolean;
  isJain: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  isPopular: boolean;
  isNew: boolean;
  image: string;
  images: string[];
  category: string;
  categoryId: string;
  tags: string[];
  ingredients: string[];
  nutrition: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
  prepTime: number;
  rating: number;
  reviewCount: number;
  variants: MenuVariant[];
  addOns: AddOn[];
  isAvailable: boolean;
  isBestSeller: boolean;
  isChefRecommendation: boolean;
  isTodaySpecial: boolean;
  isSeasonal: boolean;
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  itemCount: number;
  icon: string;
  items?: MenuItem[];
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  variant?: MenuVariant;
  addOns: AddOn[];
  quantity: number;
  instructions: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'flat' | 'bogo';
  discountValue: number;
  minOrder: number;
  maxDiscount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  image: string;
  terms: string[];
  type: 'coupon' | 'combo' | 'flash' | 'festival';
}

export interface Reservation {
  id: string;
  date: string;
  time: string;
  guestCount: number;
  occasion: string;
  specialRequests: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  tableNumber?: number;
  deposit: number;
  qrCode: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  items: OrderItem[];
  totalAmount: number;
  subtotal: number;
  deliveryCharge: number;
  packagingCharge: number;
  tip: number;
  discount: number;
  tax: number;
  couponCode?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress?: Address;
  tableNumber?: number;
  instructions: string;
  estimatedMinutes: number;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  driver?: DeliveryDriver;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'COOKING'
  | 'PACKED'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  image: string;
  isVeg: boolean;
  addOns: string[];
  instructions: string;
}

export interface StatusHistoryEntry {
  status: string;
  label: string;
  notes: string;
  createdAt: string;
}

export interface DeliveryDriver {
  name: string;
  phone: string;
  photo: string;
  rating: number;
  vehicleNumber: string;
  eta: number;
  lat: number;
  lng: number;
}

export interface Address {
  id: string;
  label: string;
  fullAddress: string;
  apartment: string;
  landmark: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
  icon: string;
}

export interface Review {
  id: string;
  menuItemId: string;
  menuItemName: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
  likes: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  dob: string;
  anniversary: string;
  preferences: {
    darkMode: boolean;
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      offers: boolean;
    };
    dietaryPreferences: string[];
    allergies: string[];
  };
  loyaltyPoints: number;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  membershipSince: string;
  totalOrders: number;
  totalSpent: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  image: string;
  publishedAt: string;
  readTime: number;
  featured: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  image: string;
  price?: number;
  capacity: number;
  registeredCount: number;
  category: 'music' | 'food' | 'cultural' | 'workshop' | 'special';
  isFree: boolean;
  isFeatured: boolean;
}

export interface GalleryImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  description: string;
  category: 'interior' | 'food' | 'events' | 'kitchen' | 'exterior';
  isVideo: boolean;
  videoUrl?: string;
  isFeatured: boolean;
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPopular: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  isVerified: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string;
  coverImage: string;
  address: string;
  phone: string;
  email: string;
  mapUrl: string;
  currency: string;
  timezone: string;
  language: string;
  cuisine: string;
  priceRange: string;
  rating: number;
  reviewCount: number;
  openingHours: {
    weekdays: string;
    weekends: string;
  };
  socialLinks: {
    instagram: string;
    facebook: string;
    twitter: string;
    youtube: string;
  };
  features: string[];
  awards: { title: string; year: string; organization: string }[];
  isOpen: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'offer' | 'reservation' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}
