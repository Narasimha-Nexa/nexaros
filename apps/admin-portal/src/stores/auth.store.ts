'use client';
import { create } from 'zustand';
import { adminApi } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ImpersonationTarget {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  token: string;
  expiresAt: string;
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  impersonationTarget: ImpersonationTarget | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AdminUser) => void;
  initialize: () => void;
  startImpersonation: (tenantId: string, userId: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isImpersonating: false,
  impersonationTarget: null,

  login: async (email: string, password: string) => {
    const result = await adminApi.login(email, password);
    adminApi.setToken(result.token);
    set({ user: result.admin, token: result.token, isAuthenticated: true });
  },

  logout: () => {
    adminApi.clearToken();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isImpersonating: false,
      impersonationTarget: null,
    });
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

  startImpersonation: async (tenantId: string, userId: string) => {
    const result = await adminApi.impersonate(tenantId, userId);
    set({
      isImpersonating: true,
      impersonationTarget: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        tenantId,
        token: result.token,
        expiresAt: result.expiresAt,
      },
    });
  },

  stopImpersonation: async () => {
    try {
      await adminApi.exitImpersonation();
    } catch {
      // Exit even if the API call fails
    }
    set({
      isImpersonating: false,
      impersonationTarget: null,
    });
  },
}));
