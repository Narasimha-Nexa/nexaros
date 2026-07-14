'use client';
import { create } from 'zustand';
import { adminApi } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AdminUser) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const result = await adminApi.login(email, password);
    adminApi.setToken(result.token);
    set({ user: result.admin, token: result.token, isAuthenticated: true });
  },

  logout: () => {
    adminApi.clearToken();
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  setUser: (user) => set({ user }),

  initialize: () => {
    const token = adminApi.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        set({
          token,
          user: { id: payload.adminId, email: payload.email, name: payload.email, role: payload.role },
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        adminApi.clearToken();
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
