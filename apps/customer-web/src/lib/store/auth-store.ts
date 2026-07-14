import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, Address, PaymentMethod, Review, Order, Notification as AppNotification } from '@/types';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  token: string | null;
  savedAddresses: Address[];
  savedPayments: PaymentMethod[];
  reviews: Review[];
  orderHistory: Order[];
  favorites: string[];
  notifications: AppNotification[];

  login: (email: string, password: string) => Promise<void>;
  signup: (data: Partial<UserProfile> & { password: string }) => Promise<void>;
  logout: () => void;
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      savedAddresses: [],
      savedPayments: [],
      reviews: [],
      orderHistory: [],
      favorites: [],
      notifications: [],

      login: async (email, password) => {
        // Mock login - replace with actual API call
        const mockUser: UserProfile = {
          id: 'user_1',
          name: 'Aarav Sharma',
          email,
          phone: '+91 98765 43210',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
          dob: '1995-06-15',
          anniversary: '',
          preferences: {
            darkMode: false,
            language: 'en',
            notifications: { email: true, sms: true, push: true, offers: true },
            dietaryPreferences: [],
            allergies: [],
          },
          loyaltyPoints: 1250,
          loyaltyTier: 'gold',
          membershipSince: '2024-01-15',
          totalOrders: 47,
          totalSpent: 28500,
        };
        set({ user: mockUser, isAuthenticated: true, token: 'mock-token' });
      },

      signup: async (data) => {
        const mockUser: UserProfile = {
          id: 'user_' + Date.now(),
          name: data.name || 'User',
          email: data.email || '',
          phone: data.phone || '',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
          dob: '',
          anniversary: '',
          preferences: {
            darkMode: false,
            language: 'en',
            notifications: { email: true, sms: true, push: true, offers: true },
            dietaryPreferences: [],
            allergies: [],
          },
          loyaltyPoints: 100,
          loyaltyTier: 'bronze',
          membershipSince: new Date().toISOString().split('T')[0],
          totalOrders: 0,
          totalSpent: 0,
        };
        set({ user: mockUser, isAuthenticated: true, token: 'mock-token' });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
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
    }),
    {
      name: 'nexaros-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        savedAddresses: state.savedAddresses,
        savedPayments: state.savedPayments,
        favorites: state.favorites,
        orderHistory: state.orderHistory,
      }),
    }
  )
);
