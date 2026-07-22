'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUIStore } from '@/lib/store/ui-store';
import { api } from '@/lib/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  websiteConfig: any;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
  websiteConfig: null,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [websiteConfig, setWebsiteConfig] = useState<any>(null);
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const theme: Theme = isDarkMode ? 'dark' : 'light';

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    api.getWebsiteConfig().then((config) => {
      if (config?.website) {
        setWebsiteConfig(config);
        const root = document.documentElement;
        const w = config.website;
        if (w.primaryColor) root.style.setProperty('--color-primary', w.primaryColor);
        if (w.secondaryColor) root.style.setProperty('--color-secondary', w.secondaryColor);
        if (w.accentColor) root.style.setProperty('--color-accent', w.accentColor);
        if (w.fontHeading) root.style.setProperty('--font-heading', w.fontHeading);
        if (w.fontBody) root.style.setProperty('--font-body', w.fontBody);
        if (w.borderRadius) root.style.setProperty('--border-radius', w.borderRadius);
      }
    }).catch(() => {});
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: toggleDarkMode, isDark: isDarkMode, websiteConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
