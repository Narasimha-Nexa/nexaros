import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DiningGuest {
  id: string;
  guestToken: string;
  guestName: string | null;
  guestNumber: number | null;
  avatarColor: string | null;
  status: string;
}

export interface DiningCartItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  menuItem: { id: string; name: string; image: string | null; isVeg: boolean };
}

export interface DiningOrder {
  id: string;
  orderNumber: number;
  status: string;
  totalAmount: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    status: string;
  }>;
}

interface DiningState {
  sessionId: string | null;
  sessionCode: string | null;
  tableId: string | null;
  tableNumber: number | null;
  branchId: string | null;
  status: string | null;

  guestSessionId: string | null;
  guestToken: string | null;
  guestName: string | null;
  guestNumber: number | null;
  avatarColor: string | null;

  guests: DiningGuest[];
  cart: DiningCartItem[];
  orders: DiningOrder[];
  subtotal: number;
  cartCount: number;

  billTotal: number;
  billPaid: number;
  billRemaining: number;

  isInitialized: boolean;
  loading: boolean;
  error: string | null;

  setSession: (data: {
    sessionId: string;
    sessionCode: string;
    tableId: string;
    tableNumber: number;
    branchId: string;
    status: string;
    guests?: DiningGuest[];
  }) => void;

  setGuest: (data: {
    guestSessionId: string;
    guestToken: string;
    guestName: string | null;
    guestNumber: number | null;
    avatarColor: string | null;
  }) => void;

  setGuests: (guests: DiningGuest[]) => void;
  addGuest: (guest: DiningGuest) => void;
  removeGuest: (guestSessionId: string) => void;

  setCart: (items: DiningCartItem[], subtotal: number) => void;
  updateCartItem: (cartItemId: string, quantity: number) => void;
  removeCartItem: (cartItemId: string) => void;
  clearCart: () => void;

  setOrders: (orders: DiningOrder[]) => void;
  addOrder: (order: DiningOrder) => void;

  setBill: (total: number, paid: number, remaining: number) => void;
  setStatus: (status: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;

  reset: () => void;
}

const initialState = {
  sessionId: null,
  sessionCode: null,
  tableId: null,
  tableNumber: null,
  branchId: null,
  status: null,
  guestSessionId: null,
  guestToken: null,
  guestName: null,
  guestNumber: null,
  avatarColor: null,
  guests: [],
  cart: [],
  orders: [],
  subtotal: 0,
  cartCount: 0,
  billTotal: 0,
  billPaid: 0,
  billRemaining: 0,
  isInitialized: false,
  loading: false,
  error: null,
};

export const useDiningStore = create<DiningState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSession: (data) =>
        set({
          sessionId: data.sessionId,
          sessionCode: data.sessionCode,
          tableId: data.tableId,
          tableNumber: data.tableNumber,
          branchId: data.branchId,
          status: data.status,
          guests: data.guests || [],
        }),

      setGuest: (data) =>
        set({
          guestSessionId: data.guestSessionId,
          guestToken: data.guestToken,
          guestName: data.guestName,
          guestNumber: data.guestNumber,
          avatarColor: data.avatarColor,
        }),

      setGuests: (guests) => set({ guests }),
      addGuest: (guest) => set((s) => ({ guests: [...s.guests, guest] })),
      removeGuest: (id) => set((s) => ({ guests: s.guests.filter((g) => g.id !== id) })),

      setCart: (items, subtotal) =>
        set({
          cart: items,
          subtotal,
          cartCount: items.reduce((sum, i) => sum + i.quantity, 0),
        }),

      updateCartItem: (cartItemId, quantity) =>
        set((s) => {
          const updated = s.cart.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
              : item,
          ).filter((item) => item.quantity > 0);
          return {
            cart: updated,
            subtotal: updated.reduce((sum, i) => sum + i.totalPrice, 0),
            cartCount: updated.reduce((sum, i) => sum + i.quantity, 0),
          };
        }),

      removeCartItem: (cartItemId) =>
        set((s) => {
          const updated = s.cart.filter((item) => item.id !== cartItemId);
          return {
            cart: updated,
            subtotal: updated.reduce((sum, i) => sum + i.totalPrice, 0),
            cartCount: updated.reduce((sum, i) => sum + i.quantity, 0),
          };
        }),

      clearCart: () => set({ cart: [], subtotal: 0, cartCount: 0 }),

      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((s) => ({ orders: [...s.orders, order] })),

      setBill: (total, paid, remaining) =>
        set({ billTotal: total, billPaid: paid, billRemaining: remaining }),

      setStatus: (status) => set({ status }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),

      reset: () => set(initialState),
    }),
    {
      name: 'nexaros-dining',
      partialize: (state) => ({
        sessionId: state.sessionId,
        sessionCode: state.sessionCode,
        tableId: state.tableId,
        tableNumber: state.tableNumber,
        branchId: state.branchId,
        guestSessionId: state.guestSessionId,
        guestToken: state.guestToken,
        guestName: state.guestName,
        guestNumber: state.guestNumber,
        avatarColor: state.avatarColor,
      }),
    },
  ),
);
