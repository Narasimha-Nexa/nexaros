'use client';

import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TENANT_INFO } from '@/lib/data/mock-data';

export function FloatingWhatsApp() {
  const phone = TENANT_INFO.phone?.replace(/[\s-+]/g, '') || '918000123456';
  const message = encodeURIComponent('Hi! I have a question about Spice Garden.');
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3',
        'bg-[#25D366] text-white rounded-full shadow-lg',
        'hover:bg-[#22c35e] hover:shadow-xl hover:scale-105',
        'transition-all duration-300 animate-fade-in-up',
        'group'
      )}
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={22} fill="white" stroke="none" />
      <span className="text-sm font-medium hidden sm:inline">Chat with us</span>
    </a>
  );
}
