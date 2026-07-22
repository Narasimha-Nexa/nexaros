import Script from 'next/script';

interface Props {
  name: string;
  slug: string;
  description?: string;
  telephone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  logo?: string | null;
  currency?: string;
}

/**
 * Per-tenant Restaurant structured data (JSON-LD) for rich search results.
 * Injected only on tenant sites; overrides the static marketing JSON-LD.
 */
export function RestaurantJsonLd({
  name, slug, description, telephone, email, address, city, state, logo, currency,
}: Props) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name,
    url: `https://${slug}.nexaros.in`,
    ...(logo ? { image: logo } : {}),
    ...(description ? { description } : {}),
    ...(currency ? { priceRange: currency } : {}),
    ...(address || city || state
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(address ? { streetAddress: address } : {}),
            ...(city ? { addressLocality: city } : {}),
            ...(state ? { addressRegion: state } : {}),
            addressCountry: 'IN',
          },
        }
      : {}),
    ...(telephone ? { telephone } : {}),
    ...(email ? { email } : {}),
  };

  return (
    <Script
      id="restaurant-jsonld"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
