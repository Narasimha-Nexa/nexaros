import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, ApiError } from '@/lib/api-client';
import type { UserProfile, Address, PaymentMethod, Review, Order, Notification as AppNotification } from '@/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  savedAddresses: Address[];
  savedPayments: PaymentMethod[];
  reviews: Review[];
  orderHistory: Order[];
  favorites: string[];
  notifications: AppNotification[];
  authLoading: boolean;
  authError: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    restaurantName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
  addAddress: (address: Address) => void;
  updateAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  addPayment: (payment: PaymentMethod) => void;
  deletePayment: (id: string) => void;
  addReview: (review: Review) => void;
  toggleFavorite: (menuItemId: string) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  setNotifications: (notifications: AppNotification[]) => void;
  markNotificationRead: (id: string) => void;
  addLoyaltyPoints: (points: number) => void;
  clearAuthError: () => void;
}

/** Map backend user shape to frontend UserProfile */
function mapToUserProfile(data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
}): UserProfile {
  return {
    id: data.id,
    name: `${data.firstName} ${data.lastName}`.trim(),
    email: data.email,
    phone: data.phone || '',
    avatar: data.avatar || '',
    dob: '',
    anniversary: '',
    preferences: {
      darkMode: false,
      language: 'en',
      notifications: { email: true, sms: true, push: true, offers: true },
      dietaryPreferences: [],
      allergies: [],
    },
    loyaltyPoints: 0,
    loyaltyTier: 'bronze',
    membershipSince: data.createdAt?.split('T')[0] || '',
    totalOrders: 0,
    totalSpent: 0,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      savedAddresses: [],
      savedPayments: [],
      reviews: [],
      orderHistory: [],
      favorites: [],
      notifications: [],
      authLoading: false,
      authError: null,

      login: async (email, password) => {
        set({ authLoading: true, authError: null });
        try {
          const response = await apiClient.post<{
            user: { id: string; email: string; firstName: string; lastName: string; role: string };
            tenant: { id: string; name: string; slug: string };
            accessToken: string;
            refreshToken: string;
          }>('auth/login', { email, password });

          const userProfile = mapToUserProfile({
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
          });

          set({
            user: userProfile,
            isAuthenticated: true,
            token: response.accessToken,
            refreshToken: response.refreshToken,
            authLoading: false,
          });
        } catch (error) {
          const message =
            error instanceof ApiError
              ? error.message
              : 'Login failed. Please check your credentials.';
          set({ authLoading: false, authError: message });
          throw error;
        }
      },

      signup: async (data) => {
        set({ authLoading: true, authError: null });
        try {
          const response = await apiClient.post<{
            user: { id: string; email: string; firstName: string; lastName: string; role: string };
            tenant: { id: string; name: string; slug: string };
            branch: { id: string; name: string };
            accessToken: string;
            refreshToken: string;
          }>('auth/register', {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone || undefined,
            password: data.password,
            restaurantName: data.restaurantName || `${data.firstName}'s Restaurant`,
          });

          const userProfile = mapToUserProfile({
            id: response.user.id,
            email: response.user.email,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
          });

          set({
            user: userProfile,
            isAuthenticated: true,
            token: response.accessToken,
            refreshToken: response.refreshToken,
            authLoading: false,
          });
        } catch (error) {
          const message =
            error instanceof ApiError
              ? error.message
              : 'Registration failed. Please try again.';
          set({ authLoading: false, authError: message });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await apiClient.post('auth/logout', { refreshToken });
          } catch {
            // Ignore logout errors — still clear local state
          }
        }
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
          authError: null,
        });
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;

        try {
          const response = await apiClient.post<{
            accessToken: string;
            refreshToken: string;
          }>('auth/refresh', { refreshToken });

          set({
            token: response.accessToken,
            refreshToken: response.refreshToken,
          });
        } catch {
          // Token expired — force logout
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            refreshToken: null,
          });
        }
      },

      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      addAddress: (address) => {
        set((state) => ({
          savedAddresses: [...state.savedAddresses, address],
        }));
      },

      updateAddress: (address) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.map((a) =>
            a.id === address.id ? address : a
          ),
        }));
      },

      deleteAddress: (id) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.filter((a) => a.id !== id),
        }));
      },

      addPayment: (payment) => {
        set((state) => ({
          savedPayments: [...state.savedPayments, payment],
        }));
      },

      deletePayment: (id) => {
        set((state) => ({
          savedPayments: state.savedPayments.filter((p) => p.id !== id),
        }));
      },

      addReview: (review) => {
        set((state) => ({
          reviews: [review, ...state.reviews],
        }));
      },

      toggleFavorite: (menuItemId) => {
        set((state) => ({
          favorites: state.favorites.includes(menuItemId)
            ? state.favorites.filter((id) => id !== menuItemId)
            : [...state.favorites, menuItemId],
        }));
      },

      addOrder: (order) => {
        set((state) => ({
          orderHistory: [order, ...state.orderHistory],
        }));
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orderHistory: state.orderHistory.map((o) =>
            o.id === orderId ? { ...o, status: status as any } : o
          ),
        }));
      },

      setNotifications: (notifications) => {
        set({ notifications });
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      addLoyaltyPoints: (points) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, loyaltyPoints: state.user.loyaltyPoints + points }
            : null,
        }));
      },

      clearAuthError: () => set({ authError: null }),
    }),
    {
      name: 'nexaros-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
        savedAddresses: state.savedAddresses,
        savedPayments: state.savedPayments,
        favorites: state.favorites,
        orderHistory: state.orderHistory,
      }),
    }
  )
);
