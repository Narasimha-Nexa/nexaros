'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type HTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

// --- Button ---
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-white hover:bg-ink/90 shadow-sm hover:shadow-md active:scale-[0.98]',
        secondary: 'bg-hairline text-ink hover:bg-hairline/80',
        outline: 'border border-hairline bg-transparent hover:bg-hairline text-ink',
        ghost: 'hover:bg-hairline text-ink',
        danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
        success: 'bg-success text-white hover:bg-success/90 shadow-sm',
        link: 'text-link underline-offset-4 hover:underline !p-0',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

// --- Input ---
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, rightIcon, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-ink/80">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-body">{icon}</div>
          )}
          <input
            type={type}
            className={cn(
              'w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink placeholder:text-body/50',
              'focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/5',
              'transition-all duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-danger focus:border-danger focus:ring-danger/10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-body">{rightIcon}</div>
          )}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// --- Badge ---
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-ink/5 text-ink',
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-danger/10 text-danger',
        outline: 'border border-hairline text-ink',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

// --- Card ---
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'glass';
}

export const Card = ({ className, padding = 'md', variant = 'default', ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-2xl border border-hairline',
      variant === 'default' && 'bg-white',
      variant === 'elevated' && 'bg-white shadow-sm hover:shadow-md transition-shadow',
      variant === 'glass' && 'bg-white/70 backdrop-blur-xl',
      padding === 'none' && 'p-0',
      padding === 'sm' && 'p-4',
      padding === 'md' && 'p-5 sm:p-6',
      padding === 'lg' && 'p-6 sm:p-8',
      className
    )}
    {...props}
  />
);

// --- Skeleton ---
export const Skeleton = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('animate-pulse rounded-lg bg-hairline', className)} {...props} />
);

// --- Divider ---
export const Divider = ({ className, ...props }: HTMLAttributes<HTMLHRElement>) => (
  <hr className={cn('border-hairline', className)} {...props} />
);

// --- Avatar ---
export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar = ({ className, src, alt, fallback, size = 'md', ...props }: AvatarProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center rounded-full bg-hairline overflow-hidden shrink-0', sizeClasses[size], className)} {...props}>
      {src ? (
        <Image src={src} alt={alt || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 160px" />
      ) : (

        <span className="font-medium text-body">{fallback || '?'}</span>
      )}
    </div>
  );
};

// --- Veg/Non-veg indicators ---
export const VegIndicator = ({ isVeg = true }: { isVeg?: boolean }) => (
  <span
    className={cn(
      'inline-flex items-center justify-center w-4 h-4 rounded-[2px] border-2 shrink-0',
      isVeg ? 'border-emerald-500' : 'border-red-500'
    )}
  >
    <span
      className={cn(
        'w-2 h-2 rounded-full',
        isVeg ? 'bg-emerald-500' : 'bg-red-500'
      )}
    />
  </span>
);

// --- Rating Stars ---
export const RatingStars = ({ rating, size = 'sm', showValue = true }: { rating: number; size?: 'sm' | 'md' | 'lg'; showValue?: boolean }) => {
  const sizeMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg' };
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(
              'text-yellow-400',
              size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
            )}
            fill={star <= Math.round(rating) ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </div>
      {showValue && <span className={cn('font-medium text-ink', sizeMap[size])}>{rating.toFixed(1)}</span>}
    </div>
  );
};

// --- Quantity Selector ---
export const QuantitySelector = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 0,
  max = 99,
  size = 'md',
}: {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}) => {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div className="inline-flex items-center gap-1.5 bg-hairline rounded-lg p-0.5">
      <button
        onClick={onDecrease}
        disabled={quantity <= min}
        className={cn(
          sizeClasses,
          'flex items-center justify-center rounded-md transition-colors',
          'hover:bg-white text-ink/70 hover:text-ink',
          'disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        aria-label="Decrease quantity"
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className={cn('font-semibold text-ink text-center select-none min-w-[20px]', size === 'sm' ? 'text-xs' : 'text-sm')}>
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        disabled={quantity >= max}
        className={cn(
          sizeClasses,
          'flex items-center justify-center rounded-md transition-colors',
          'hover:bg-white text-ink/70 hover:text-ink',
          'disabled:opacity-30 disabled:cursor-not-allowed'
        )}
        aria-label="Increase quantity"
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

// --- Price Display ---
export const PriceDisplay = ({ price, originalPrice, currency = 'INR', size = 'md' }: {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const sizeClasses = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
  const format = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 0 }).format(val);

  return (
    <div className="inline-flex items-baseline gap-2">
      <span className={cn('font-bold text-ink', sizeClasses[size])}>{format(price)}</span>
      {originalPrice && originalPrice > price && (
        <span className={cn('text-body line-through', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {format(originalPrice)}
        </span>
      )}
    </div>
  );
};

// --- Search Input ---
export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onVoiceSearch?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onVoiceSearch, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-body/60">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={ref}
          type="text"
          className={cn(
            'w-full rounded-xl border border-hairline bg-white pl-10 pr-12 py-3 text-sm text-ink placeholder:text-body/40',
            'focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/5',
            'transition-all duration-200',
            className
          )}
          {...props}
        />
        {onVoiceSearch && (
          <button
            onClick={onVoiceSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-body/60 hover:text-ink transition-colors"
            aria-label="Voice search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

// --- Empty State ---
export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="text-5xl mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
    {description && <p className="text-sm text-body max-w-sm mb-6">{description}</p>}
    {action}
  </div>
);

// --- Section Header ---
export const SectionHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-end justify-between mb-6 sm:mb-8">
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-ink">{title}</h2>
      {subtitle && <p className="text-body mt-1">{subtitle}</p>}
    </div>
    {action && <div className="hidden sm:block">{action}</div>}
  </div>
);
