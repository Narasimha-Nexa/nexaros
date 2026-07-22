import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import type { WebsiteResponse } from '@/lib/restaurant-data';

interface TenantState {
  slug: string | null;
  tenant: WebsiteResponse['tenant'] | null;
  website: WebsiteResponse['website'] | null;
  categories: WebsiteResponse['categories'];
  branches: WebsiteResponse['branches'];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchTenant: (slug: string) => Promise<void>;
  updateWebsite: (patch: Partial<WebsiteResponse['website']>) => void;
  clearTenant: () => void;
}

const STALE_MS = 5 * 60 * 1000;

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      slug: null,
      tenant: null,
      website: null,
      categories: [],
      branches: [],
      loading: false,
      error: null,
      lastFetched: null,

      fetchTenant: async (slug) => {
        const state = get();
        if (state.slug === slug && state.lastFetched && Date.now() - state.lastFetched < STALE_MS) {
          return;
        }

        set({ loading: true, error: null });
        try {
          const res = await apiClient.get<WebsiteResponse>(`public/website/${slug}`);
          set({
            slug,
            tenant: res.tenant,
            website: res.website,
            categories: res.categories,
            branches: res.branches,
            loading: false,
            lastFetched: Date.now(),
          });
        } catch (err) {
          set({
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load restaurant',
          });
        }
      },

      updateWebsite: (patch) => {
        set((state) => ({
          website: state.website ? { ...state.website, ...patch } : null,
        }));
      },

      clearTenant: () => {
        set({
          slug: null,
          tenant: null,
          website: null,
          categories: [],
          branches: [],
          loading: false,
          error: null,
          lastFetched: null,
        });
      },
    }),
    {
      name: 'nexaros-tenant',
      partialize: (state) => ({
        slug: state.slug,
        tenant: state.tenant,
        website: state.website,
        categories: state.categories,
        branches: state.branches,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
