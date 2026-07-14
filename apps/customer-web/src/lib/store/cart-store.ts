import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MenuItem, MenuVariant, AddOn, CartItem } from '@/types';
import { generateId, formatPrice } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  instructions: string;
  packagingPreference: 'eco' | 'standard' | 'premium';
  cutleryPreference: boolean;
  tip: number;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  scheduledDate: string | null;
  scheduledTime: string | null;
  deliveryAddressId: string | null;

  addItem: (
    menuItem: MenuItem,
    quantity?: number,
    variant?: MenuVariant,
    addOns?: AddOn[],
    instructions?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  setCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setInstructions: (instructions: string) => void;
  setPackagingPreference: (pref: 'eco' | 'standard' | 'premium') => void;
  setCutleryPreference: (pref: boolean) => void;
  setTip: (tip: number) => void;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => void;
  setScheduledOrder: (date: string | null, time: string | null) => void;
  setDeliveryAddress: (addressId: string | null) => void;

  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getDeliveryCharge: () => number;
  getPackagingCharge: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      instructions: '',
      packagingPreference: 'standard',
      cutleryPreference: true,
      tip: 0,
      orderType: 'DELIVERY',
      scheduledDate: null,
      scheduledTime: null,
      deliveryAddressId: null,

      addItem: (menuItem, quantity = 1, variant, addOns = [], instructions = '') => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.menuItem.id === menuItem.id &&
              item.variant?.id === variant?.id
          );

          const basePrice = variant ? variant.price : menuItem.price;
          const addOnPrice = addOns.reduce((sum, ao) => sum + ao.price, 0);
          const unitPrice = basePrice + addOnPrice;

          if (existingIndex >= 0) {
            const existing = state.items[existingIndex];
            const updatedItem = {
              ...existing,
              quantity: existing.quantity + quantity,
              totalPrice: (existing.quantity + quantity) * unitPrice,
              addOns: [...new Set([...existing.addOns, ...addOns])],
            };
            const items = [...state.items];
            items[existingIndex] = updatedItem;
            return { items };
          }

          const newItem: CartItem = {
            id: generateId(),
            menuItem,
            variant,
            addOns,
            quantity,
            instructions,
            unitPrice,
            totalPrice: quantity * unitPrice,
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
              : item
          ),
        }));
      },

      updateInstructions: (itemId, instructions) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, instructions } : item
          ),
        }));
      },

      clearCart: () =>
        set({
          items: [],
          couponCode: null,
          couponDiscount: 0,
          instructions: '',
          tip: 0,
          deliveryAddressId: null,
        }),

      setCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),
      setInstructions: (instructions) => set({ instructions }),
      setPackagingPreference: (pref) => set({ packagingPreference: pref }),
      setCutleryPreference: (pref) => set({ cutleryPreference: pref }),
      setTip: (tip) => set({ tip }),
      setOrderType: (type) => set({ orderType: type }),
      setScheduledOrder: (date, time) => set({ scheduledDate: date, scheduledTime: time }),
      setDeliveryAddress: (addressId) => set({ deliveryAddressId: addressId }),

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),
      getDiscount: () => get().couponDiscount,
      getDeliveryCharge: () => {
        const subtotal = get().getSubtotal();
        return subtotal > 500 ? 0 : 40;
      },
      getPackagingCharge: () => {
        const pref = get().packagingPreference;
        if (pref === 'eco') return 0;
        if (pref === 'premium') return 25;
        return 10;
      },
      getTax: () => {
        const subtotal = get().getSubtotal();
        return Math.round(subtotal * 0.05);
      },
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const delivery = get().getDeliveryCharge();
        const packaging = get().getPackagingCharge();
        const tax = get().getTax();
        const tip = get().tip;
        return subtotal - discount + delivery + packaging + tax + tip;
      },
    }),
    {
      name: 'nexaros-cart',
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
        packagingPreference: state.packagingPreference,
        cutleryPreference: state.cutleryPreference,
        orderType: state.orderType,
      }),
    }
  )
);
