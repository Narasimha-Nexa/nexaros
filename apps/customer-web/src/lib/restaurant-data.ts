/**
 * Server-side data accessors for the dynamic restaurant homepage.
 *
 * These run on the server (Next.js RSC) and call the backend REST API
 * directly. They never touch the browser-only auth store.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const url = `${API_BASE}/${path}`;
    const res = await fetch(url, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`[restaurant-data] ${url} returned ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[restaurant-data] fetch failed for ${path}:`, err);
    return null;
  }
}

export interface WebsiteResponse {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    currency?: string;
    timezone?: string;
    businessType?: string;
  };
  website: {
    restaurantName?: string;
    tagline?: string | null;
    logo?: string | null;
    favicon?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    mapUrl?: string | null;
    whatsappNumber?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontHeading?: string;
    fontBody?: string;
    borderRadius?: string;
    containerWidth?: string;
    features?: Record<string, unknown>;
    seo?: Record<string, unknown>;
    openingHours?: Record<string, { open?: string; close?: string; isOpen?: boolean }>;
    socialLinks?: Record<string, string>;
    legalPages?: Record<string, { title?: string; content?: string }>;
    homeSections?: Array<Record<string, unknown>>;
  };
  categories: Array<{
    id: string;
    name: string;
    description?: string;
    items?: Array<{
      id: string;
      name: string;
      description?: string;
      price: number;
      image?: string | null;
      isVeg?: boolean;
    }>;
  }>;
  branches: Array<{ id: string; name: string }>;
}

export async function fetchRestaurantSite(slug: string): Promise<WebsiteResponse | null> {
  return getJson<WebsiteResponse>(`public/website/${slug}`);
}

export async function fetchGallery(slug: string) {
  return getJson<Array<{ id: string; url: string; alt?: string; category?: string; caption?: string }>>(
    `public/gallery/${slug}`,
  );
}

export async function fetchTestimonials(slug: string) {
  return getJson<Array<{ id: string; name: string; text?: string; rating?: number; avatar?: string }>>(
    `public/cms/${slug}/testimonials`,
  );
}

export async function fetchFAQs(slug: string) {
  return getJson<Array<{ id: string; question: string; answer: string }>>(`public/cms/${slug}/faqs`);
}

export async function fetchBlog(slug: string) {
  return getJson<Array<Record<string, unknown>>>(`public/cms/${slug}/blog`);
}

export async function fetchEvents(slug: string) {
  return getJson<Array<Record<string, unknown>>>(`public/cms/${slug}/events`);
}

export async function fetchOffers(slug: string) {
  return getJson<Array<Record<string, unknown>>>(`public/offers/${slug}`);
}

export async function fetchAnnouncements(slug: string) {
  return getJson<Array<{ id: string; title: string; message: string; type?: string; isPinned?: boolean }>>(
    `public/announcements/${slug}`,
  );
}
