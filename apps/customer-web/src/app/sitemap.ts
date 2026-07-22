import type { MetadataRoute } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexaros.in';

interface TenantSlug {
  slug: string;
}

async function getTenantSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE}/public/plans`, { cache: 'no-store' });
    if (!res.ok) return [];
    // The plans endpoint doesn't list tenants, so we return an empty array.
    // For production, this should query an admin endpoint listing active tenant slugs.
    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  entries.push(
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cancellation-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookie-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  );

  // Dynamic tenant pages — in production, fetch active slugs from a tenant listing endpoint
  const slugs = await getTenantSlugs();
  for (const slug of slugs) {
    entries.push(
      {
        url: `${SITE_URL}/${slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${SITE_URL}/${slug}/menu`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/${slug}/offers`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      },
      {
        url: `${SITE_URL}/${slug}/gallery`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${SITE_URL}/${slug}/contact`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${SITE_URL}/${slug}/about`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
    );
  }

  return entries;
}
