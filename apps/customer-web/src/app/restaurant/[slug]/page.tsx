import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RestaurantSite } from '@/components/restaurant/RestaurantSite';
import { RestaurantJsonLd } from '@/components/restaurant/RestaurantJsonLd';
import {
  fetchRestaurantSite,
  fetchGallery,
  fetchTestimonials,
  fetchOffers,
  fetchAnnouncements,
} from '@/lib/restaurant-data';

function safeUrlBase(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchRestaurantSite(slug);
  if (!data) return { title: { absolute: 'Restaurant Not Found' } };

  const w = data.website || {};
  const t = data.tenant || {};
  const name = w.restaurantName || t.name || 'Restaurant';
  const seo = (w.seo || {}) as Record<string, unknown>;

  const title = (seo.title as string) || `${name} | ${w.tagline || 'Order Online'}`;
  const description = (seo.description as string) || `${name} — order food online, view menu, offers and more.`;
  const ogImage = (seo.ogImage as string) || '';
  const favicon = w.favicon || t.logo || undefined;
  const keywords = Array.isArray(seo.keywords) ? (seo.keywords as string[]) : undefined;

  return {
    title: { absolute: title },
    description,
    keywords,
    metadataBase: safeUrlBase(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
    alternates: { canonical: `/${slug}` },
    icons: favicon ? { icon: favicon, apple: favicon } : undefined,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/${slug}`,
      siteName: name,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function RestaurantHomePage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchRestaurantSite(slug);

  if (!data || !data.tenant) {
    notFound();
  }

  const [gallery, testimonials, offers, announcements] = await Promise.all([
    fetchGallery(slug),
    fetchTestimonials(slug),
    fetchOffers(slug),
    fetchAnnouncements(slug),
  ]);

  const w0 = data.website || {};
  const t0 = data.tenant || {};

  return (
    <>
      <RestaurantJsonLd
        name={w0.restaurantName || t0.name || 'Restaurant'}
        slug={slug}
        description={w0.tagline || undefined}
        telephone={t0.phone}
        email={t0.email}
        address={t0.address}
        city={t0.city}
        state={t0.state}
        logo={w0.logo || t0.logo || null}
        currency={t0.currency || 'INR'}
      />
      <RestaurantSite
        data={data}
        gallery={gallery || []}
        testimonials={testimonials || []}
        offers={offers || []}
        announcements={announcements || []}
        slug={slug}
      />
    </>
  );
}
