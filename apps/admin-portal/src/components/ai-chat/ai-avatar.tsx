'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIAvatarProps {
  size?: 'sm' | 'md' | 'lg';
}

export function AIAvatar({ size = 'md' }: AIAvatarProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0`}
    >
      <Sparkles size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} className="text-primary" />
    </div>
  );
}

export function UserAvatar({ initials }: { initials: string }) {
  return (
    <div className="w-9 h-9 rounded-none bg-ink text-white flex items-center justify-center shrink-0 text-xs font-semibold">
      {initials}
    </div>
  );
}
