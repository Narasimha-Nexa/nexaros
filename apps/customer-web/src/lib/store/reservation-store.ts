import { create } from 'zustand';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Reservation } from '@/types';

interface AvailableSlot {
  time: string;
  available: boolean;
  capacity: number;
}

interface ReservationState {
  reservations: Reservation[];
  availableSlots: AvailableSlot[];
  selectedDate: string;
  selectedTime: string;
  loading: boolean;
  slotsLoading: boolean;
  error: string | null;

  fetchSlots: (slug: string, date: string) => Promise<void>;
  createReservation: (
    slug: string,
    data: {
      customerName: string;
      customerPhone: string;
      date: string;
      time: string;
      guestCount: number;
      occasion?: string;
      specialRequests?: string;
    }
  ) => Promise<Reservation>;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  addReservation: (reservation: Reservation) => void;
  clearError: () => void;
}

export const useReservationStore = create<ReservationState>()((set, get) => ({
  reservations: [],
  availableSlots: [],
  selectedDate: '',
  selectedTime: '',
  loading: false,
  slotsLoading: false,
  error: null,

  fetchSlots: async (slug, date) => {
    set({ slotsLoading: true, error: null, selectedDate: date });
    try {
      const res = await apiClient.get<{ slots: AvailableSlot[] }>(
        `public/reservations/${slug}/slots`,
        { date }
      );
      set({ availableSlots: res.slots || [], slotsLoading: false });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch available slots';
      set({ slotsLoading: false, error: message });
    }
  },

  createReservation: async (slug, data) => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post<Reservation>(`public/reservations/${slug}`, data);
      set((state) => ({
        reservations: [...state.reservations, res],
        loading: false,
      }));
      return res;
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to create reservation';
      set({ loading: false, error: message });
      throw err;
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedTime: (time) => set({ selectedTime: time }),
  addReservation: (reservation) => {
    set((state) => ({
      reservations: [...state.reservations, reservation],
    }));
  },
  clearError: () => set({ error: null }),
}));
