import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Order, OrderStatus } from '@/types';

interface OrderTrackingResponse {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  estimatedMinutes: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    status: string;
    image: string;
    isVeg: boolean;
  }[];
  statusHistory: {
    status: string;
    label: string;
    notes: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface OrderState {
  activeOrderId: string | null;
  activeOrder: OrderTrackingResponse | null;
  orderHistory: Order[];
  loading: boolean;
  trackingLoading: boolean;
  error: string | null;

  placeOrder: (order: {
    tenantId: string;
    branchId?: string;
    items: { menuItemId: string; quantity: number; variantId?: string; addOnIds?: string[]; instructions?: string }[];
    orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
    tableId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress?: string;
    instructions?: string;
    couponCode?: string;
  }) => Promise<string>;
  trackOrder: (orderId: string) => Promise<void>;
  fetchOrderHistory: () => Promise<void>;
  updateOrderFromSocket: (orderId: string, status: OrderStatus) => void;
  clearError: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      activeOrderId: null,
      activeOrder: null,
      orderHistory: [],
      loading: false,
      trackingLoading: false,
      error: null,

      placeOrder: async (orderData) => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.post<{ id: string; orderNumber: number }>('public/orders', orderData);
          set({ loading: false, activeOrderId: res.id });
          return res.id;
        } catch (err) {
          const message =
            err instanceof ApiError ? err.message : 'Failed to place order';
          set({ loading: false, error: message });
          throw err;
        }
      },

      trackOrder: async (orderId) => {
        set({ trackingLoading: true, error: null, activeOrderId: orderId });
        try {
          const res = await apiClient.get<OrderTrackingResponse>(`public/orders/${orderId}/track`);
          set({ activeOrder: res, trackingLoading: false });
        } catch (err) {
          const message =
            err instanceof ApiError ? err.message : 'Failed to track order';
          set({ trackingLoading: false, error: message });
        }
      },

      fetchOrderHistory: async () => {
        set({ loading: true, error: null });
        try {
          const res = await apiClient.get<{ orders: Order[] }>('orders');
          set({ orderHistory: res.orders || [], loading: false });
        } catch (err) {
          const message =
            err instanceof ApiError ? err.message : 'Failed to fetch order history';
          set({ loading: false, error: message });
        }
      },

      updateOrderFromSocket: (orderId, status) => {
        const { activeOrder } = get();
        if (activeOrder && activeOrder.id === orderId) {
          set({
            activeOrder: { ...activeOrder, status, updatedAt: new Date().toISOString() },
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'nexaros-orders',
      partialize: (state) => ({
        activeOrderId: state.activeOrderId,
        orderHistory: state.orderHistory,
      }),
    }
  )
);
