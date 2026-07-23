import { NextResponse, type NextRequest } from 'next/server';

// Static app routes that must NOT be treated as tenant slugs.
const STATIC_ROUTES = new Set([
  'menu', 'about', 'cart', 'checkout', 'login', 'signup', 'offers',
  'gallery', 'events', 'blog', 'contact', 'faq', 'orders', 'track-order',
  'order-success', 'payment', 'forgot-password', 'reservations', 'profile',
  'privacy-policy', 'terms', 'refund-policy', 'cancellation-policy',
  'cookie-policy', 'not-found', 'restaurant',
]);

// In-memory tenant-existence cache (TTL 60s)
const cache = new Map<string, { exists: boolean; ts: number }>();
const CACHE_TTL = 60_000;
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'nexaros.in';

async function tenantExists(slug: string): Promise<boolean> {
  const cached = cache.get(slug);
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL) return cached.exists;

  try {
    const res = await fetch(`${API}/public/tenant/${slug}`, { cache: 'no-store' });
    const exists = res.ok;
    cache.set(slug, { exists, ts: now });
    return exists;
  } catch {
    return true;
  }
}

async function tenantBySubdomain(subdomain: string): Promise<{ slug: string } | null> {
  try {
    const res = await fetch(`${API}/public/tenant/subdomain/${subdomain}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return { slug: data.slug || data.id };
  } catch {
    return null;
  }
}

async function tenantByCustomDomain(domain: string): Promise<{ slug: string } | null> {
  try {
    const res = await fetch(`${API}/public/tenant/domain/${domain}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return { slug: data.slug || data.id };
  } catch {
    return null;
  }
}

function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];
  const parts = host.split('.');
  if (parts.length <= 1) return null;
  const subdomain = parts[0];
  if (subdomain === 'www' || subdomain === 'localhost') return null;
  return subdomain;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Pass through static internals
  const seg = pathname.split('/')[1];
  if (!seg) return NextResponse.next();
  if (STATIC_ROUTES.has(seg)) return NextResponse.next();
  if (pathname.startsWith('/restaurant/')) return NextResponse.next();
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next')) return NextResponse.next();
  if (pathname.startsWith('/sitemap') || pathname.startsWith('/robots')) return NextResponse.next();

  // ── Custom domain resolution ──
  // Check if the hostname is a custom domain (not localhost, not nexaros.in subdomain)
  const host = hostname.split(':')[0];
  const isLocalhost = host === 'localhost' || host.startsWith('127.0.0.1') || host.startsWith('0.0.0.0');
  const isNexarosSubdomain = host.endsWith(`.${BASE_DOMAIN}`);
  const isCustomDomain = !isLocalhost && !isNexarosSubdomain;

  if (isCustomDomain) {
    const tenant = await tenantByCustomDomain(host);
    if (tenant) {
      // Rewrite to the restaurant page for this tenant
      const url = req.nextUrl.clone();
      url.pathname = `/restaurant/${tenant.slug}${pathname}`;
      return NextResponse.rewrite(url);
    }
    // Unknown custom domain → 404
    return NextResponse.rewrite(new URL('/not-found', req.url), { status: 404 });
  }

  // ── Subdomain resolution ──
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    const tenant = await tenantBySubdomain(subdomain);
    if (tenant) {
      // Rewrite to the restaurant page for this tenant
      const url = req.nextUrl.clone();
      url.pathname = `/restaurant/${tenant.slug}${pathname}`;
      return NextResponse.rewrite(url);
    }
    // Unknown subdomain → 404
    return NextResponse.rewrite(new URL('/not-found', req.url), { status: 404 });
  }

  // ── Path-based slug resolution ──
  const exists = await tenantExists(seg);
  if (!exists) {
    return NextResponse.rewrite(new URL(`/restaurant/${seg}`, req.url), { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api).*)'],
};
