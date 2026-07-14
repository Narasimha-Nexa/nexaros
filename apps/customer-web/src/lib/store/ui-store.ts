import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isDarkMode: boolean;
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  isAIAssistantOpen: boolean;
  notifications: number;
  activeLanguage: string;

  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setAIAssistantOpen: (open: boolean) => void;
  setNotifications: (count: number) => void;
  setLanguage: (lang: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      isCartOpen: false,
      isSearchOpen: false,
      isMobileMenuOpen: false,
      isAIAssistantOpen: false,
      notifications: 0,
      activeLanguage: 'en',

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (value) => set({ isDarkMode: value }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      openSearch: () => set({ isSearchOpen: true }),
      closeSearch: () => set({ isSearchOpen: false }),
      toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      setAIAssistantOpen: (open) => set({ isAIAssistantOpen: open }),
      setNotifications: (count) => set({ notifications: count }),
      setLanguage: (lang) => set({ activeLanguage: lang }),
    }),
    {
      name: 'nexaros-ui',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        activeLanguage: state.activeLanguage,
      }),
    }
  )
);
