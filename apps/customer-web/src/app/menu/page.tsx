'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, SlidersHorizontal, Grid3X3, List, X,
} from 'lucide-react';
import { Button, Card, Badge, SectionHeader, VegIndicator, EmptyState, RatingStars, PriceDisplay, SearchInput } from '@/components/ui';
import { cn, formatPrice, truncate } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useUIStore } from '@/lib/store/ui-store';
import { api } from '@/lib/api';
import type { MenuItem, MenuCategory } from '@/types';

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    veg: false,
    nonVeg: false,
    vegan: false,
    glutenFree: false,
    spicy: false,
  });
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();

  useEffect(() => {
    async function load() {
      const [cats, menuItems] = await Promise.all([
        api.getMenuCategories(),
        api.getMenuItems(),
      ]);
      setCategories(cats);
      setItems(menuItems);
      setLoading(false);
    }
    load();
  }, []);

  // Filter & sort
  let filteredItems = items.filter((item) => {
    if (activeCategory !== 'all' && item.categoryId !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false;
    }
    if (filters.veg && !item.isVeg) return false;
    if (filters.nonVeg && item.isVeg) return false;
    if (filters.vegan && !item.isVegan) return false;
    if (filters.glutenFree && !item.isGlutenFree) return false;
    if (filters.spicy && !item.isSpicy) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearFilters = () => {
    setFilters({ veg: false, nonVeg: false, vegan: false, glutenFree: false, spicy: false });
    setSearchQuery('');
    setActiveCategory('all');
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchQuery || activeCategory !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink">Our Menu</h1>
        <p className="text-body mt-1">Discover our handcrafted dishes made with love</p>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <SearchInput
            placeholder="Search menu items, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-4 py-3 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium',
              showFilters || hasActiveFilters
                ? 'border-ink bg-ink text-white'
                : 'border-hairline text-body hover:text-ink hover:border-ink/30'
            )}
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
          <div className="flex rounded-xl border border-hairline overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-3 transition-colors', viewMode === 'grid' ? 'bg-hairline text-ink' : 'text-body hover:text-ink')}
              aria-label="Grid view"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-3 transition-colors', viewMode === 'list' ? 'bg-hairline text-ink' : 'text-body hover:text-ink')}
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-3 rounded-xl border border-hairline text-sm text-ink bg-white focus:outline-none focus:border-ink/30"
          >
            <option value="popular">Popular</option>
            <option value="rating">Rating</option>
            <option value="price-low">Price: Low</option>
            <option value="price-high">Price: High</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6 p-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'veg' as const, label: 'Veg', color: 'bg-emerald-500' },
              { key: 'nonVeg' as const, label: 'Non-Veg', color: 'bg-red-500' },
              { key: 'vegan' as const, label: 'Vegan', color: 'bg-green-600' },
              { key: 'glutenFree' as const, label: 'Gluten Free', color: 'bg-amber-500' },
              { key: 'spicy' as const, label: 'Spicy', color: 'bg-orange-500' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5',
                  filters[key]
                    ? 'border-ink bg-ink text-white'
                    : 'border-hairline text-body hover:border-ink/30'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', filters[key] ? 'bg-white' : color)} />
                {label}
              </button>
            ))}
            {hasActiveFilters && (
              <button onClick={clearFilters} className="px-3 py-1.5 rounded-full text-xs font-medium text-danger hover:bg-danger/5 flex items-center gap-1">
                <X size={14} /> Clear All
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
            activeCategory === 'all'
              ? 'bg-ink text-white border-ink'
              : 'bg-white text-body border-hairline hover:text-ink hover:border-ink/30'
          )}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
              activeCategory === cat.id
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-body border-hairline hover:text-ink hover:border-ink/30'
            )}
          >
            {cat.icon} {cat.name} ({cat.itemCount})
          </button>
        ))}
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-body">
          Showing {filteredItems.length} of {items.length} items
        </p>
      </div>

      {/* Menu Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-hairline/50 overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-hairline" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-hairline rounded w-3/4" />
                <div className="h-3 bg-hairline rounded w-full" />
                <div className="h-3 bg-hairline rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No items found"
          description="Try adjusting your filters or search query"
          action={
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          }
        />
      ) : (
        <div className={cn(
          'gap-4 sm:gap-6',
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-3'
        )}>
          {filteredItems.map((item) => (
            viewMode === 'grid' ? (
              <Link
                key={item.id}
                href={`/menu/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group bg-white dark:bg-ink rounded-2xl border border-hairline overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {item.isBestSeller && <Badge variant="primary">Bestseller</Badge>}
                    {item.isNew && <Badge variant="success">New</Badge>}
                  </div>
                  {item.originalPrice && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="danger">-{Math.round((1 - item.price / item.originalPrice) * 100)}%</Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <VegIndicator isVeg={item.isVeg} />
                    <h3 className="font-semibold text-sm text-ink truncate">{item.name}</h3>
                  </div>
                  <p className="text-xs text-body line-clamp-2 mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <PriceDisplay price={item.price} originalPrice={item.originalPrice} size="sm" />
                    <div className="flex items-center gap-1">
                      <RatingStars rating={item.rating} size="sm" />
                      <span className="text-xs text-body">({item.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div key={item.id} className="flex gap-4 bg-white dark:bg-ink rounded-2xl border border-hairline p-4 hover:shadow-md transition-shadow">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-hairline relative">
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <VegIndicator isVeg={item.isVeg} />
                    <h3 className="font-semibold text-ink">{item.name}</h3>
                  </div>
                  <p className="text-sm text-body line-clamp-1">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <PriceDisplay price={item.price} originalPrice={item.originalPrice} size="sm" />
                    <RatingStars rating={item.rating} size="sm" />
                    <span className="text-xs text-body">{item.nutrition.calories} cal</span>
                  </div>
                </div>
                <button
                  onClick={() => { addItem(item); openCart(); }}
                  className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center hover:bg-ink/80 shrink-0 transition-colors"
                  aria-label={`Add ${item.name} to cart`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
