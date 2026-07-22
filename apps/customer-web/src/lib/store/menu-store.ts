import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import type { MenuCategory, MenuItem } from '@/types';

interface MenuItemApi {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  isVeg?: boolean;
  isVegan?: boolean;
  isJain?: boolean;
  isGlutenFree?: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isAvailable?: boolean;
  isBestSeller?: boolean;
  isChefRecommendation?: boolean;
  isTodaySpecial?: boolean;
  isSeasonal?: boolean;
  tags?: string[];
  ingredients?: string[];
  prepTime?: number;
  rating?: number;
  reviewCount?: number;
  variants?: { id: string; name: string; price: number }[];
  addOns?: { id: string; name: string; price: number; isVeg?: boolean }[];
  nutrition?: { calories: number; protein: string; carbs: string; fat: string; fiber: string };
}

interface MenuCategoryApi {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  items?: MenuItemApi[];
}

interface MenuState {
  categories: MenuCategory[];
  allItems: MenuItem[];
  searchQuery: string;
  activeCategory: string | null;
  dietaryFilter: 'all' | 'veg' | 'vegan' | 'jain' | 'gluten-free';
  sortBy: 'popularity' | 'price-low' | 'price-high' | 'rating' | 'newest';
  loading: boolean;
  error: string | null;

  fetchMenu: (slug: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (categoryId: string | null) => void;
  setDietaryFilter: (filter: 'all' | 'veg' | 'vegan' | 'jain' | 'gluten-free') => void;
  setSortBy: (sort: 'popularity' | 'price-low' | 'price-high' | 'rating' | 'newest') => void;
  getFilteredItems: () => MenuItem[];
  getCategoryItems: (categoryId: string) => MenuItem[];
  searchItems: (query: string) => MenuItem[];
}

function mapApiItem(item: MenuItemApi): MenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description || '',
    price: item.price,
    isVeg: item.isVeg ?? false,
    isVegan: item.isVegan ?? false,
    isJain: item.isJain ?? false,
    isGlutenFree: item.isGlutenFree ?? false,
    isSpicy: item.isSpicy ?? false,
    isPopular: item.isPopular ?? false,
    isNew: item.isNew ?? false,
    image: item.image || '',
    images: item.image ? [item.image] : [],
    category: '',
    categoryId: '',
    tags: item.tags || [],
    ingredients: item.ingredients || [],
    nutrition: item.nutrition || { calories: 0, protein: '0g', carbs: '0g', fat: '0g', fiber: '0g' },
    prepTime: item.prepTime || 15,
    rating: item.rating || 0,
    reviewCount: item.reviewCount || 0,
    variants: item.variants || [],
    addOns: (item.addOns || []).map((ao) => ({ ...ao, isVeg: ao.isVeg ?? false })),
    isAvailable: item.isAvailable ?? true,
    isBestSeller: item.isBestSeller ?? false,
    isChefRecommendation: item.isChefRecommendation ?? false,
    isTodaySpecial: item.isTodaySpecial ?? false,
    isSeasonal: item.isSeasonal ?? false,
    originalPrice: undefined,
  };
}

function mapApiCategory(cat: MenuCategoryApi): MenuCategory {
  const items = (cat.items || []).map(mapApiItem).map((item) => ({
    ...item,
    category: cat.name,
    categoryId: cat.id,
  }));
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description || '',
    image: cat.image || '',
    itemCount: items.length,
    icon: cat.icon || '',
    items,
  };
}

export const useMenuStore = create<MenuState>()((set, get) => ({
  categories: [],
  allItems: [],
  searchQuery: '',
  activeCategory: null,
  dietaryFilter: 'all',
  sortBy: 'popularity',
  loading: false,
  error: null,

  fetchMenu: async (slug) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get<{ categories: MenuCategoryApi[] }>(`public/menu/${slug}`);
      const categories = (res.categories || []).map(mapApiCategory);
      const allItems = categories.flatMap((c) => c.items || []);
      set({ categories, allItems, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load menu',
      });
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveCategory: (categoryId) => set({ activeCategory: categoryId }),
  setDietaryFilter: (filter) => set({ dietaryFilter: filter }),
  setSortBy: (sort) => set({ sortBy: sort }),

  getFilteredItems: () => {
    const { allItems, searchQuery, activeCategory, dietaryFilter, sortBy } = get();
    let items = [...allItems];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (activeCategory) {
      items = items.filter((item) => item.categoryId === activeCategory);
    }

    if (dietaryFilter !== 'all') {
      items = items.filter((item) => {
        switch (dietaryFilter) {
          case 'veg': return item.isVeg;
          case 'vegan': return item.isVegan;
          case 'jain': return item.isJain;
          case 'gluten-free': return item.isGlutenFree;
          default: return true;
        }
      });
    }

    switch (sortBy) {
      case 'price-low': items.sort((a, b) => a.price - b.price); break;
      case 'price-high': items.sort((a, b) => b.price - a.price); break;
      case 'rating': items.sort((a, b) => b.rating - a.rating); break;
      case 'newest': items.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      case 'popularity': items.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)); break;
    }

    return items;
  },

  getCategoryItems: (categoryId) => {
    const cat = get().categories.find((c) => c.id === categoryId);
    return cat?.items || [];
  },

  searchItems: (query) => {
    const q = query.toLowerCase();
    return get().allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  },
}));
