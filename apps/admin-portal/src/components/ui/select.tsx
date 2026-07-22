'use client';
import { cn } from '@/lib/utils';
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, hint, options, className, id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && <label htmlFor={selectId} className="label">{label}</label>}
      <div className="relative">
        <select
          id={selectId}
          className={cn('input appearance-none cursor-pointer pr-10', error && 'input-error', className)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-body">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-danger font-sans">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-body font-sans">{hint}</p>}
    </div>
  );
}
