'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Star, Clock, Shield, Truck, Award, MapPin, ChevronLeft, ChevronRight,
  Sparkles, TrendingUp, ChefHat, UtensilsCrossed,
} from 'lucide-react';
import { Button, Card, Badge, RatingStars, SectionHeader, VegIndicator } from '@/components/ui';
import { cn, formatPrice, truncate } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useUIStore } from '@/lib/store/ui-store';
import { useCountUp } from '@/lib/hooks/use-scroll';
import { api } from '@/lib/api';
import { TENANT_INFO, TESTIMONIALS } from '@/lib/data/mock-data';
import type { MenuItem, MenuCategory } from '@/types';

export default function HomePage() {
  const [featuredCategories, setFeaturedCategories] = useState<MenuCategory[]>([]);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [bestSellers, setBestSellers] = useState<MenuItem[]>([]);
  const [chefRecs, setChefRecs] = useState<MenuItem[]>([]);
  const [todaySpecials, setTodaySpecials] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();
  const orderCount = useCountUp(15000, 3000, 14000);
  const reviewsCount = useCountUp(2345, 3000, 2000);
  const yearsCount = useCountUp(12, 2000, 10);

  useEffect(() => {
    async function load() {
      const [categories, popular, best, chef, specials] = await Promise.all([
        api.getMenuCategories(),
        api.getPopularItems(),
        api.getBestSellers(),
        api.getChefRecommendations(),
        api.getTodaySpecials(),
      ]);
      setFeaturedCategories(categories.slice(0, 6));
      setPopularItems(popular);
      setBestSellers(best);
      setChefRecs(chef);
      setTodaySpecials(specials);
      setLoading(false);
    }
    load();
  }, []);

  // Hero carousel auto-play
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const heroSlides = [
    {
      title: 'Where Every Meal Tells a Story',
      subtitle: 'Experience award-winning Indian cuisine crafted with passion',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=900&fit=crop',
      cta: 'Explore Menu',
      href: '/menu',
    },
    {
      title: 'A Taste of Tradition',
      subtitle: 'Authentic flavors passed down through generations',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&h=900&fit=crop',
      cta: 'Book a Table',
      href: '/reservations',
    },
    {
      title: 'Delivered to Your Doorstep',
      subtitle: 'Enjoy restaurant-quality meals from the comfort of your home',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=900&fit=crop',
      cta: 'Order Now',
      href: '/menu',
    },
  ];

  return (
    <div className="space-y-0">
      {/* ──────── HERO SECTION ──────── */}
      <section className="relative h-[70vh] sm:h-[80vh] min-h-[500px] sm:min-h-[600px] overflow-hidden">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === heroSlide ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
            <Image
              src={slide.image}
              alt=""
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />
          </div>
        ))}

        <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-white/80 text-xs sm:text-sm mb-4 sm:mb-6 animate-fade-in">
              <Sparkles size={14} className="text-yellow-400" />
              Award-Winning Dining Since 2012
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-4 sm:mb-6 animate-fade-in-up">
              {heroSlides[heroSlide].title.split('<br />').map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {i === 0 && <span className="text-white">{line}</span>}
                  {i > 0 && <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">{line}</span>}
                </span>
              ))}
            </h1>
            <p className="text-white/70 text-base sm:text-lg md:text-xl max-w-lg mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {heroSlides[heroSlide].subtitle}
            </p>
            <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link href={heroSlides[heroSlide].href}>
                <Button size="xl" className="bg-white text-ink hover:bg-white/90 shadow-xl shadow-white/20 gap-2">
                  {heroSlides[heroSlide].cta}
                  <ArrowRight size={20} />
                </Button>
              </Link>
              <Link href="/reservations">
                <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Reserve a Table
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                i === heroSlide ? 'w-8 bg-white' : 'bg-white/40 hover:bg-white/60'
              )}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Nav arrows */}
        <button
          onClick={() => setHeroSlide((heroSlide + 2) % 3)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setHeroSlide((heroSlide + 1) % 3)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </section>

      {/* ──────── STATS BANNER ──────── */}
      <section className="relative -mt-12 z-30 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-hairline rounded-2xl overflow-hidden shadow-xl">
          {[
            { value: `${yearsCount}+`, label: 'Years of Excellence', icon: Award },
            { value: `${orderCount.toLocaleString('en-IN')}+`, label: 'Orders Served', icon: UtensilsCrossed },
            { value: `${reviewsCount.toLocaleString('en-IN')}+`, label: 'Happy Reviews', icon: Star },
            { value: '4.7★', label: 'Average Rating', icon: TrendingUp },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-ink p-4 sm:p-6 text-center">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
              <div className="text-2xl sm:text-3xl font-bold text-ink mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-body">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────── FEATURED CATEGORIES ──────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <SectionHeader
          title="Explore Our Menu"
          subtitle="Handcrafted categories to satisfy every craving"
          action={
            <Link href="/menu">
              <Button variant="ghost" className="text-sm">
                View Full Menu <ArrowRight size={16} />
              </Button>
            </Link>
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {featuredCategories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/menu/${cat.id}`}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-hairline hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, 16vw"
              />
              <div className="absolute inset-0 gradient-overlay-full" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <span className="text-lg sm:text-2xl block mb-1">{cat.icon}</span>
                <h3 className="text-white font-semibold text-sm sm:text-base">{cat.name}</h3>
                <p className="text-white/60 text-xs mt-0.5">{cat.itemCount} items</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ──────── TODAY'S SPECIAL ──────── */}
      {todaySpecials.length > 0 && (
        <section className="bg-gradient-to-r from-ink to-ink-dark text-white py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <Badge variant="warning" className="mb-3">Today&apos;s Special</Badge>
                <h2 className="text-2xl sm:text-4xl font-bold">Chef&apos;s Pick of the Day</h2>
                <p className="text-white/60 mt-1">Limited quantities available</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {todaySpecials.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/menu/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group relative rounded-2xl overflow-hidden bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
                >
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                    <p className="text-white/60 text-sm line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-lg">{formatPrice(item.price)}</span>
                      <span className="text-xs text-yellow-400">Limited Time</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ──────── BEST SELLERS ──────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <SectionHeader
          title="Best Sellers"
          subtitle="Our most loved dishes, handpicked for you"
          action={
            <Link href="/menu">
              <Button variant="ghost" className="text-sm">
                View All <ArrowRight size={16} />
              </Button>
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestSellers.slice(0, 4).map((item) => (
            <FoodCard key={item.id} item={item} onAddToCart={() => { addItem(item); openCart(); }} />
          ))}
        </div>
      </section>

      {/* ──────── WHY CHOOSE US ──────── */}
      <section className="bg-hairline/50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader title="Why Choose Spice Garden" subtitle="We go the extra mile for an unforgettable experience" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ChefHat, title: 'Expert Chefs', desc: 'Award-winning chefs with decades of culinary expertise' },
              { icon: Star, title: 'Premium Quality', desc: 'Finest ingredients sourced from local farms and global markets' },
              { icon: Shield, title: 'Hygiene First', desc: '5-star hygiene rating with rigorous safety standards' },
              { icon: Truck, title: 'Fast Delivery', desc: 'Free delivery within 5km, hot food at your doorstep' },
            ].map((feature) => (
              <Card key={feature.title} variant="elevated" className="text-center p-6 sm:p-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-ink text-lg mb-2">{feature.title}</h3>
                <p className="text-body text-sm leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── CHEF RECOMMENDATIONS ──────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <SectionHeader
          title="Chef Recommends"
          subtitle="Specially curated by our executive chef"
          action={
            <Link href="/menu">
              <Button variant="ghost" className="text-sm">View All <ArrowRight size={16} /></Button>
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {chefRecs.slice(0, 3).map((item) => (
            <FoodCard key={item.id} item={item} onAddToCart={() => { addItem(item); openCart(); }} featured />
          ))}
        </div>
      </section>

      {/* ──────── RESERVATION CTA ──────── */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=800&fit=crop"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center sm:text-left">
          <div className="max-w-xl mx-auto sm:mx-0">
            <Badge variant="warning" className="mb-4">Reserve Your Table</Badge>
            <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-4">
              Ready for an Unforgettable Evening?
            </h2>
            <p className="text-white/60 text-lg mb-6">
              Book your table at Spice Garden and experience award-winning Indian cuisine in an elegant setting.
            </p>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              <Link href="/reservations">
                <Button size="lg" className="bg-white text-ink hover:bg-white/90">
                  Reserve Now <ArrowRight size={18} />
                </Button>
              </Link>
              <a href={`tel:${TENANT_INFO.phone}`}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Call {TENANT_INFO.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ──────── TESTIMONIALS ──────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <SectionHeader title="What Our Guests Say" subtitle="Real reviews from our valued guests" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.slice(0, 3).map((testimonial) => (
            <Card key={testimonial.id} variant="elevated" className="p-6">
              <RatingStars rating={testimonial.rating} />
              <p className="text-ink/80 text-sm mt-3 mb-4 leading-relaxed">&ldquo;{testimonial.comment}&rdquo;</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-hairline relative">
                  <Image src={testimonial.avatar} alt={testimonial.name} fill className="object-cover" sizes="40px" />
                </div>
                <div>
                  <p className="font-medium text-sm text-ink">{testimonial.name}</p>
                  <p className="text-xs text-body">Verified Guest</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ──────── NEWSLETTER ──────── */}
      <section className="bg-ink text-white py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Stay in the Loop</h2>
          <p className="text-white/60 mb-6">Get exclusive offers, new menu announcements, and event invites.</p>
          <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
            />
            <Button type="submit" className="bg-white text-ink hover:bg-white/90 shrink-0">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      {/* ──────── MAP ──────── */}
      <section className="h-[300px] sm:h-[400px] bg-hairline relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-semibold text-ink">{TENANT_INFO.address}</p>
            <a
              href={TENANT_INFO.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline mt-1 inline-block"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
        {/* You would embed Google Maps iframe here */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.5!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzE3LjgiTiA3N8KwMzUnNDAuNSJF!5e0!3m2!1sen!2sin!4v1"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Spice Garden Location"
        />
      </section>
    </div>
  );
}

/* ── Food Card sub-component ── */
function FoodCard({ item, onAddToCart, featured = false }: { item: MenuItem; onAddToCart: () => void; featured?: boolean }) {
  return (
    <div className={cn(
      'group bg-white dark:bg-ink rounded-2xl overflow-hidden border border-hairline transition-all duration-300',
      'hover:shadow-lg hover:-translate-y-0.5',
    )}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, 25vw"
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.isBestSeller && <Badge variant="primary">Bestseller</Badge>}
          {item.isNew && <Badge variant="success">New</Badge>}
          {item.isSpicy && <Badge variant="warning">Spicy</Badge>}
        </div>
        {item.originalPrice && (
          <div className="absolute top-2 right-2">
            <Badge variant="danger">-{Math.round((1 - item.price / item.originalPrice) * 100)}%</Badge>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 gradient-overlay" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <VegIndicator isVeg={item.isVeg} />
            <h3 className="font-semibold text-sm sm:text-base text-ink truncate">{item.name}</h3>
          </div>
          <RatingStars rating={item.rating} size="sm" />
        </div>
        <p className="text-xs text-body line-clamp-2 mb-3">{item.description}</p>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-ink text-base">{formatPrice(item.price)}</span>
            {item.originalPrice && (
              <span className="text-xs text-body line-through ml-2">{formatPrice(item.originalPrice)}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onAddToCart(); }}
            className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center hover:bg-ink/80 transition-colors"
            aria-label={`Add ${item.name} to cart`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
