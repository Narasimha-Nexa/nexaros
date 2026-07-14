'use client';
import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-card animate-slide-in-right pointer-events-auto"
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle size={16} className="text-success" />}
            {toast.type === 'error' && <AlertCircle size={16} className="text-danger" />}
            {toast.type === 'info' && <Info size={16} className="text-info" />}
          </div>
          <p className="text-body-sm font-sans flex-1 min-w-0">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 p-0.5 text-body hover:text-ink transition-colors"
          >
            <X size={14} />
          </button>
          <div
            className="toast-progress"
            style={{ width: `${toast.progress}%` }}
          />
        </div>
      ))}
    </div>
  );
}
