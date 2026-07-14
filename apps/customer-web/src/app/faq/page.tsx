'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { FAQ } from '@/types';

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    api.getFAQs().then((data) => {
      setFaqs(data);
      setLoading(false);
    });
  }, []);

  const categories = ['all', ...new Set(faqs.map((f) => f.category))];
  const filtered = faqs.filter((faq) => {
    if (activeCategory !== 'all' && faq.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!faq.question.toLowerCase().includes(q) && !faq.answer.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-hairline rounded w-48 mb-6" />
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-hairline rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Frequently Asked Questions</h1>
        <p className="text-body">Find answers to common questions about Spice Garden</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-body/60" size={20} />
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-hairline text-ink text-sm focus:outline-none focus:border-ink/30"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all',
              activeCategory === cat ? 'bg-ink text-white border-ink' : 'bg-white text-body border-hairline hover:text-ink'
            )}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((faq) => (
          <div key={faq.id} className="border border-hairline rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-ink hover:bg-hairline/30 transition-colors"
              aria-expanded={openId === faq.id}
            >
              <span>{faq.question}</span>
              <ChevronDown size={16} className={cn('transition-transform shrink-0', openId === faq.id && 'rotate-180')} />
            </button>
            {openId === faq.id && (
              <div className="px-5 pb-4 text-sm text-body leading-relaxed animate-fade-in">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-body">No FAQs found matching your search</div>
        )}
      </div>
    </div>
  );
}
