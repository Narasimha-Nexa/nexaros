'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUIStore } from '@/lib/store/ui-store';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isDarkMode, toggleDarkMode, setDarkMode } = useUIStore();
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

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: toggleDarkMode, isDark: isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
