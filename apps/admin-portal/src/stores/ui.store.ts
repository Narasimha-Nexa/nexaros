'use client';
import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  isCollapsed: false,
  isMobileOpen: false,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  collapse: () => set({ isCollapsed: true }),
  expand: () => set({ isCollapsed: false }),
  openMobile: () => set({ isMobileOpen: true }),
  closeMobile: () => set({ isMobileOpen: false }),
}));

interface ModalState {
  isOpen: boolean;
  title: string;
  content: React.ReactNode | null;
  open: (title: string, content: React.ReactNode) => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  title: '',
  content: null,
  open: (title, content) => set({ isOpen: true, title, content }),
  close: () => set({ isOpen: false, title: '', content: null }),
}));

interface ToastState {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info'; progress: number }>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type, progress: 100 }] }));

    // Progress animation
    const startTime = Date.now();
    const duration = 5000;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 100 - (elapsed / duration) * 100);
      set((s) => ({
        toasts: s.toasts.map((t) => (t.id === id ? { ...t, progress } : t)),
      }));
      if (progress > 0) requestAnimationFrame(tick);
      else set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    };
    requestAnimationFrame(tick);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
