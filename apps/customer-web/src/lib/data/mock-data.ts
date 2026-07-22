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
  MenuVariant,
  AddOn,
  TenantInfo,
  Notification,
} from '@/types';

// NOTE: All fake/seed data has been removed. These exports now resolve to
// empty values so the customer portal degrades gracefully (empty states)
// instead of rendering fabricated content when the backend has no data yet.
// Real data is fetched from the live API; see lib/api.ts.

export const TENANT_INFO: TenantInfo = {
  id: '',
  name: '',
  slug: '',
  tagline: '',
  description: '',
  logo: '',
  coverImage: '',
  address: '',
  phone: '',
  email: '',
  mapUrl: '',
  currency: '',
  timezone: '',
  language: '',
  cuisine: '',
  priceRange: '',
  rating: 0,
  reviewCount: 0,
  openingHours: { weekdays: '', weekends: '' },
  socialLinks: { instagram: '', facebook: '', twitter: '', youtube: '' },
  features: [],
  awards: [],
  isOpen: false,
};

export const MENU_CATEGORIES: MenuCategory[] = [];

export const MENU_ITEMS: MenuItem[] = [];

export const OFFERS: Offer[] = [];

export const TESTIMONIALS: Testimonial[] = [];

export const TEAM_MEMBERS: TeamMember[] = [];

export const BLOG_POSTS: BlogPost[] = [];

export const EVENTS: Event[] = [];

export const GALLERY_IMAGES: GalleryImage[] = [];

export const FAQS: FAQ[] = [];

export const PROFILE_DATA: Partial<UserProfile> = {};

export const SAVED_ADDRESSES: Address[] = [];

export const SAVED_PAYMENTS: PaymentMethod[] = [];

export const MOCK_ORDER_HISTORY: Order[] = [];

export const MOCK_REVIEWS: Review[] = [];

export const NOTIFICATIONS: Notification[] = [];
