'use client';
import { cn } from '@/lib/utils';
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={cn('input', error && 'input-error', className)}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger font-sans">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-body font-sans">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
