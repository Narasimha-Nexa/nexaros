'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin, Phone, Mail, Clock, Camera, Globe, MessageCircle, Share2,
  Star, ArrowRight, ChevronRight, Menu as MenuIcon, X, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import { useTenantSocket } from '@/lib/socket';
import type { WebsiteResponse } from '@/lib/restaurant-data';

interface MenuItemLite {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  isVeg?: boolean;
}

interface Props {
  data: WebsiteResponse;
  gallery: Array<{ id: string; url: string; alt?: string; category?: string; caption?: string }>;
  testimonials: Array<{ id: string; name: string; text?: string; rating?: number; avatar?: string }>;
  offers: Array<Record<string, unknown>>;
  announcements: Array<{ id: string; title?: string; message: string; type?: string; isPinned?: boolean }>;
  slug: string;
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

function safeUrl(u?: string | null) {
  if (!u) return undefined;
  return u;
}

export function RestaurantSite({ data, gallery, testimonials, offers, announcements, slug }: Props) {
  const w = data.website || ({} as WebsiteResponse['website']);
  const t = data.tenant || ({} as WebsiteResponse['tenant']);
  const name = w.restaurantName || t.name || 'Restaurant';
  const primary = w.primaryColor || '#E23744';
  const secondary = w.secondaryColor || '#171717';
  const accent = w.accentColor || '#f59e0b';
  const whatsapp = w.whatsappNumber || '';
  const social = w.socialLinks || {};
  const hours = w.openingHours || {};

  const [menu, setMenu] = useState(data.categories || []);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  // Real-time: soft-refresh when owner updates any public content.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => router.refresh(), 500);
  }, [router]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useTenantSocket({
    slug,
    onMenuUpdated: debouncedRefresh,
    onRestaurantUpdated: debouncedRefresh,
    onOfferUpdated: debouncedRefresh,
    onAnnouncementUpdated: debouncedRefresh,
    onGalleryUpdated: debouncedRefresh,
    onWebsiteUpdated: debouncedRefresh,
  });

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hero =
    (w.homeSections || []).find((s) => s.type === 'hero') ||
    ({ type: 'hero', title: `Welcome to ${name}`, subtitle: w.tagline || '', ctaText: 'View Menu', ctaLink: '#menu', backgroundImage: '' } as Record<string, unknown>);
  const about =
    (w.homeSections || []).find((s) => s.type === 'about') ||
    ({ type: 'about', title: 'Our Story', content: '', image: '' } as Record<string, unknown>);

  const brandInitials = name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const navLinks = [
    { href: '#about', label: 'About' },
    { href: '#menu', label: 'Menu' },
    ...(gallery.length ? [{ href: '#gallery', label: 'Gallery' }] : []),
    ...(offers.length ? [{ href: '#offers', label: 'Offers' }] : []),
    { href: '#hours', label: 'Hours' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <div
      style={
        {
          '--r-primary': primary,
          '--r-secondary': secondary,
          '--r-accent': accent,
          '--r-font-display': `${w.fontHeading || 'Playfair Display'}, Georgia, serif`,
          '--r-font-body': `${w.fontBody || 'Inter'}, system-ui, sans-serif`,
        } as React.CSSProperties
      }
      className="min-h-screen bg-white"
    >
      {/* Announcement bar */}
      {whatsapp && (
        <div className="bg-[var(--r-secondary)] text-white text-center text-xs sm:text-sm py-2 px-4">
          <span>
            📞 Order on WhatsApp:{' '}
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} className="font-semibold underline">
              {whatsapp}
            </a>
          </span>
        </div>
      )}

      {/* Active announcements (owner-managed) */}
      {announcements.length > 0 && (
        <div className="bg-[var(--r-primary)] text-white text-center text-xs sm:text-sm py-2 px-4">
          {announcements.slice(0, 1).map((a) => (
            <span key={a.id}>
              {a.isPinned ? '📌 ' : ''}
              {a.message}
            </span>
          ))}
        </div>
      )}

      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          isScrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-black/5' : 'bg-white',
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <a href="#top" className="flex items-center gap-2.5 shrink-0">
              {w.logo ? (
                <Image src={safeUrl(w.logo)!} alt={name} width={40} height={40} className="rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white" style={{ background: 'var(--r-primary)' }}>
                  {brandInitials}
                </div>
              )}
              <span className="font-bold text-lg" style={{ color: 'var(--r-secondary)' }}>{name}</span>
            </a>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="px-3 py-2 rounded-lg text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
                  {l.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href="#menu"
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-transform active:scale-95"
                style={{ background: 'var(--r-primary)' }}
              >
                Order Now
              </a>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-neutral-700" aria-label="Menu">
                {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-black/5 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative min-h-[70vh] flex items-center" style={{ background: `linear-gradient(135deg, ${primary}0d, ${accent}0d)` }}>
        <div className="absolute inset-0 overflow-hidden">
          {hero.backgroundImage ? (
            <Image src={safeUrl(hero.backgroundImage as string)!} alt="" fill className="object-cover opacity-20" sizes="100vw" />
          ) : null}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--r-primary)' }}>
              {(hero.subtitle as string) || w.tagline || 'Welcome'}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4" style={{ fontFamily: 'var(--r-font-display)', color: 'var(--r-secondary)' }}>
              {(hero.title as string) || `Welcome to ${name}`}
            </h1>
            <p className="text-lg text-neutral-600 mb-8 max-w-xl">{t.address || w.address || ''}</p>
            <div className="flex flex-wrap gap-3">
              <a href="#menu" className="px-7 py-3.5 rounded-full text-white font-semibold text-base transition-transform hover:-translate-y-0.5" style={{ background: 'var(--r-primary)' }}>
                {(hero.ctaText as string) || 'View Menu'} <ArrowRight className="inline ml-1" size={18} />
              </a>
              <a href={`/reservations?slug=${encodeURIComponent(slug)}`} className="px-7 py-3.5 rounded-full font-semibold text-base border transition-colors" style={{ borderColor: 'var(--r-secondary)', color: 'var(--r-secondary)' }}>
                Book a Table
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--r-font-display)', color: 'var(--r-secondary)' }}>
              {(about.title as string) || 'Our Story'}
            </h2>
            <p className="text-neutral-600 leading-relaxed whitespace-pre-line">
              {(about.content as string) || `${name} serves authentic flavours crafted with passion. Visit us for a memorable dining experience.`}
            </p>
          </div>
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-100">
            {about.image ? (
              <Image src={safeUrl(about.image as string)!} alt={name} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400" style={{ background: `${primary}0d` }}>
                <Camera size={48} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Menu preview */}
      <section id="menu" className="py-16 sm:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: 'var(--r-font-display)', color: 'var(--r-secondary)' }}>Our Menu</h2>
              <p className="text-neutral-500 mt-1">Fresh, made-to-order dishes</p>
            </div>
            <a href="#menu" className="hidden sm:flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--r-primary)' }}>
              View full menu <ChevronRight size={16} />
            </a>
          </div>

          {menu.length === 0 ? (
            <p className="text-neutral-500">Menu coming soon.</p>
          ) : (
            <div className="space-y-10">
              {menu.slice(0, 4).map((cat) => (
                <div key={cat.id}>
                  <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--r-secondary)' }}>{cat.name}</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(cat.items || []).slice(0, 3).map((item: MenuItemLite) => (
                      <div key={item.id} className="bg-white rounded-2xl border border-black/5 p-4 flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn('w-3 h-3 rounded-sm border', item.isVeg ? 'border-green-600' : 'border-red-600')}>
                              <span className={cn('block w-1.5 h-1.5 rounded-full mx-auto mt-0.5', item.isVeg ? 'bg-green-600' : 'bg-red-600')} />
                            </span>
                            <h4 className="font-medium text-neutral-900">{item.name}</h4>
                          </div>
                          {item.description && <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{item.description}</p>}
                          <p className="text-sm font-semibold mt-2" style={{ color: 'var(--r-primary)' }}>{formatPrice(item.price, t.currency || 'INR')}</p>
                        </div>
                        {item.image && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-neutral-100 relative">
                            <Image src={safeUrl(item.image)!} alt={item.name} fill className="object-cover" sizes="80px" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <a href="#menu" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold transition-transform hover:-translate-y-0.5" style={{ background: 'var(--r-primary)' }}>
              Browse Full Menu & Order <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section id="gallery" className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center" style={{ fontFamily: 'var(--r-font-display)', color: 'var(--r-secondary)' }}>Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.slice(0, 8).map((img) => (
                <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 group">
                  <Image src={safeUrl(img.url)!} alt={img.alt || name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width:640px) 50vw, 25vw" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <section id="offers" className="py-16 sm:py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center" style={{ fontFamily: 'var(--r-font-display)', color: 'var(--r-secondary)' }}>Featured Offers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {offers.slice(0, 6).map((o, i) => (
                <div key={(o.id as string) || i} className="bg-white rounded-2xl border border-black/5 p-6">
                  <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--r-secondary)' }}>{(o.title as string) || 'Special Offer'}</h3>
                  <p className="text-sm text-neutral-500">{(o.description as string) || (o.code as string) || ''}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Hours + Contact */}
      <section id="hours" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-10">
          <div id="contact">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ fontFamily: 'var(--r-font-display)', color: 'var(--r-secondary)' }}>Visit Us</h2>
            <ul className="space-y-4">
              {t.address && (
                <li className="flex items-start gap-3 text-neutral-600">
                  <MapPin size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--r-primary)' }} />
                  <span>{t.address}{t.city ? `, ${t.city}` : ''}{t.state ? `, ${t.state}` : ''}</span>
                </li>
              )}
              {t.phone && (
                <li className="flex items-center gap-3 text-neutral-600">
                  <Phone size={20} className="shrink-0" style={{ color: 'var(--r-primary)' }} />
                  <a href={`tel:${t.phone}`} className="hover:underline">{t.phone}</a>
                </li>
              )}
              {t.email && (
                <li className="flex items-center gap-3 text-neutral-600">
                  <Mail size={20} className="shrink-0" style={{ color: 'var(--r-primary)' }} />
                  <a href={`mailto:${t.email}`} className="hover:underline">{t.email}</a>
                </li>
              )}
              {w.mapUrl && (
                <li className="flex items-center gap-3 text-neutral-600">
                  <Globe size={20} className="shrink-0" style={{ color: 'var(--r-primary)' }} />
                  <a href={w.mapUrl} target="_blank" rel="noreferrer" className="hover:underline">View on map</a>
                </li>
              )}
            </ul>

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
            )}

            <div className="flex gap-3 mt-6">
              {Object.entries(social)
                .filter(([, url]) => url)
                .map(([platform, url]) => (
                  <a key={platform} href={url!} target="_blank" rel="noreferrer" aria-label={platform} className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200">
                    <Share2 size={18} />
                  </a>
                ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ fontFamily: 'var(--r-font-display)', color: 'var(--r-secondary)' }}>Opening Hours</h2>
            <div className="space-y-2">
              {Object.entries(hours).map(([day, h]) => {
                const isOpen = (h as { isOpen?: boolean }).isOpen !== false;
                const open = (h as { open?: string }).open;
                const close = (h as { close?: string }).close;
                return (
                  <div key={day} className="flex items-center justify-between py-2.5 border-b border-black/5">
                    <span className="font-medium capitalize text-neutral-700">{DAY_LABELS[day] || day}</span>
                    <span className="text-sm" style={{ color: isOpen && open ? 'var(--r-primary)' : 'var(--r-secondary)' }}>
                      {isOpen && open ? `${open} – ${close}` : 'Closed'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {testimonials.length > 0 && (
        <section className="py-16 sm:py-24 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center" style={{ fontFamily: 'var(--r-font-display)', color: 'var(--r-secondary)' }}>What Guests Say</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.slice(0, 6).map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-black/5 p-6">
                  <div className="flex gap-1 mb-3" style={{ color: 'var(--r-accent)' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < (r.rating || 5) ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <p className="text-neutral-600 text-sm mb-4">&ldquo;{r.text || ''}&rdquo;</p>
                  <p className="font-semibold text-sm" style={{ color: 'var(--r-secondary)' }}>{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer name={name} slug={slug} primary={primary} secondary={secondary} social={social} whatsapp={whatsapp} address={t.address} phone={t.phone} email={t.email} legalPages={w.legalPages} brandInitials={brandInitials} logo={w.logo} />
    </div>
  );
}

function Footer({
  name, slug, primary, secondary, social, whatsapp, address, phone, email, legalPages, brandInitials, logo,
}: {
  name: string; slug: string; primary: string; secondary: string;
  social: Record<string, string>; whatsapp: string; address?: string | null; phone?: string | null; email?: string | null;
  legalPages?: Record<string, { title?: string; content?: string }>;
  brandInitials: string; logo?: string | null;
}) {
  const year = new Date().getFullYear();
  const policyLinks: Array<{ key: string; href: string; label: string }> = [
    { key: 'privacyPolicy', href: `/${slug}/privacy-policy`, label: 'Privacy Policy' },
    { key: 'termsOfService', href: `/${slug}/terms`, label: 'Terms of Service' },
    { key: 'refundPolicy', href: `/${slug}/refund-policy`, label: 'Refund Policy' },
    { key: 'cancellationPolicy', href: `/${slug}/cancellation-policy`, label: 'Cancellation Policy' },
    { key: 'cookiePolicy', href: `/${slug}/cookie-policy`, label: 'Cookie Policy' },
  ];

  return (
    <footer className="text-white" style={{ background: secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              {logo ? (
                <Image src={safeUrl(logo)!} alt={name} width={36} height={36} className="rounded-lg object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: primary }}>{brandInitials}</div>
              )}
              <span className="font-bold text-lg">{name}</span>
            </div>
            <div className="flex gap-2">
              {Object.entries(social)
                .filter(([, url]) => url)
                .map(([platform, url]) => (
                  <a key={platform} href={url!} target="_blank" rel="noreferrer" aria-label={platform} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
                    <Share2 size={16} />
                  </a>
                ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><a href={`/${slug}#menu`} className="hover:text-white">Menu</a></li>
              <li><a href={`/${slug}#gallery`} className="hover:text-white">Gallery</a></li>
              <li><a href={`/${slug}#offers`} className="hover:text-white">Offers</a></li>
              <li><a href={`/${slug}#contact`} className="hover:text-white">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2.5 text-sm text-white/60">
              {policyLinks.map((p) => (
                <li key={p.key}>
                  <Link href={p.href} className="hover:text-white">{p.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-white/60">
              {address && <li className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0" /><span>{address}</span></li>}
              {phone && <li className="flex items-center gap-2.5"><Phone size={16} className="shrink-0" /><a href={`tel:${phone}`} className="hover:text-white">{phone}</a></li>}
              {email && <li className="flex items-center gap-2.5"><Mail size={16} className="shrink-0" /><a href={`mailto:${email}`} className="hover:text-white">{email}</a></li>}
              {whatsapp && <li className="flex items-center gap-2.5"><MessageCircle size={16} className="shrink-0" /><a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} className="hover:text-white">WhatsApp</a></li>}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>&copy; {year} {name}. All rights reserved. Powered by <span className="text-white/60 font-medium">NexaROS</span></p>
        </div>
      </div>
    </footer>
  );
}
