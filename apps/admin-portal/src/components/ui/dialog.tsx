'use client';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContextType {
  close: () => void;
}

const DialogContext = createContext<DialogContextType>({ close: () => {} });

export function useDialog() {
  return useContext(DialogContext);
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Dialog({ open, onClose, title, children, size = 'md' }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', handler);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handler); };
    }
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div ref={overlayRef} className="dialog-overlay absolute inset-0" onClick={onClose} />
      <DialogContext.Provider value={{ close: onClose }}>
        <div
          className={cn(
            'relative bg-canvas border border-hairline w-full mx-0 sm:mx-4',
            'max-h-[95vh] sm:max-h-[90vh] flex flex-col',
            'animate-slide-in-up sm:animate-fade-in',
            sizeClasses[size],
          )}
        >
          {title && (
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-hairline shrink-0">
              <h2 className="text-display-xs font-sans truncate pr-4">{title}</h2>
              <button onClick={onClose} className="p-1.5 text-body hover:text-ink hover:bg-canvas-soft transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>
          )}
          <div className="overflow-y-auto p-5 sm:p-6 flex-1">{children}</div>
        </div>
      </DialogContext.Provider>
    </div>
  );
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-hairline', className)}>
      {children}
    </div>
  );
}
