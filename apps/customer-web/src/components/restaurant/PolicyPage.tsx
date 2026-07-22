'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchRestaurantSite } from '@/lib/restaurant-data';

interface PolicyPageProps {
  slug: string;
  policyKey: 'privacyPolicy' | 'termsOfService' | 'refundPolicy' | 'cancellationPolicy' | 'cookiePolicy';
  fallbackTitle: string;
}

export function PolicyPage({ slug, policyKey, fallbackTitle }: PolicyPageProps) {
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState(fallbackTitle);
  const [name, setName] = useState('');

  useEffect(() => {
    fetchRestaurantSite(slug).then((data) => {
      if (!data) return;
      const w = data.website || {};
      setName(w.restaurantName || data.tenant?.name || 'Restaurant');
      const legal = w.legalPages || {};
      const entry = legal[policyKey];
      if (entry) {
        setTitle(entry.title || fallbackTitle);
        setContent(entry.content || '');
      }
    });
  }, [slug, policyKey, fallbackTitle]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link href={`/${slug}`} className="text-sm text-neutral-500 hover:text-neutral-900 mb-6 inline-block">
        ← Back to {name || 'restaurant'}
      </Link>
      <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
      {content ? (
        <div className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed whitespace-pre-line">{content}</div>
      ) : (
        <p className="text-neutral-500">This policy is being updated. Please check back soon.</p>
      )}
    </div>
  );
}
