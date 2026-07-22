'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Copy, Clock, Tag, Gift, Zap, Sparkles, Check } from 'lucide-react';
import { Button, Card, Badge, SectionHeader, EmptyState } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';
import { api, getCurrentTenantSlug } from '@/lib/api';
import { useTenantSocket } from '@/lib/socket';
import type { Offer } from '@/types';

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    api.getOffers().then((data) => {
      setOffers(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  // ── Real-time offer updates ──
  // When the restaurant owner creates/updates/expires offers,
  // reload the offers list so customers see changes instantly.
  useTenantSocket({
    slug: getCurrentTenantSlug(),
    onOfferUpdated: () => {
      loadOffers();
    },
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderOfferCard = (offer: Offer) => (
    <Card key={offer.id} variant="elevated" className="overflow-hidden">
      <div className="relative h-40 overflow-hidden">
        <Image src={offer.image} alt={offer.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge variant={offer.type === 'flash' ? 'danger' : offer.type === 'combo' ? 'primary' : offer.type === 'festival' ? 'warning' : 'success'}>
            {offer.type === 'flash' ? '⚡ Flash Sale' : offer.type === 'combo' ? '🎯 Combo' : offer.type === 'festival' ? '🎉 Festival' : '🏷️ Coupon'}
          </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg">{offer.title}</h3>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <p className="text-sm text-body">{offer.description}</p>
        <div className="flex items-center gap-2 text-xs text-body">
          <Clock size={14} />
          <span>Valid till {new Date(offer.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-hairline">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-primary" />
            <span className="font-mono font-bold text-ink">{offer.code}</span>
          </div>
          <button
            onClick={() => handleCopyCode(offer.code)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
              copiedCode === offer.code
                ? 'bg-success/10 text-success'
                : 'bg-ink text-white hover:bg-ink/90'
            )}
          >
            {copiedCode === offer.code ? (
              <><Check size={14} /> Copied!</>
            ) : (
              <><Copy size={14} /> Copy Code</>
            )}
          </button>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-hairline rounded w-48" />
          <div className="h-5 bg-hairline rounded w-72" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-hairline/50 overflow-hidden">
                <div className="h-40 bg-hairline" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-hairline rounded w-3/4" />
                  <div className="h-3 bg-hairline rounded w-full" />
                  <div className="h-10 bg-hairline rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const flashOffers = offers.filter((o) => o.type === 'flash');
  const couponOffers = offers.filter((o) => o.type === 'coupon');
  const comboOffers = offers.filter((o) => o.type === 'combo');
  const festivalOffers = offers.filter((o) => o.type === 'festival');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Offers & Deals</h1>
        <p className="text-body">Exclusive discounts and combos to make your meal even better</p>
      </div>

      {flashOffers.length > 0 && (
        <section>
          <SectionHeader title="⚡ Flash Sales" subtitle="Limited time offers - grab them before they're gone!" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashOffers.map(renderOfferCard)}
          </div>
        </section>
      )}

      {couponOffers.length > 0 && (
        <section>
          <SectionHeader title="🏷️ Coupons" subtitle="Use these codes at checkout for instant savings" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {couponOffers.map(renderOfferCard)}
          </div>
        </section>
      )}

      {comboOffers.length > 0 && (
        <section>
          <SectionHeader title="🎯 Combo Offers" subtitle="Curated meal combos at unbeatable prices" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {comboOffers.map(renderOfferCard)}
          </div>
        </section>
      )}

      {festivalOffers.length > 0 && (
        <section>
          <SectionHeader title="🎉 Festival Specials" subtitle="Celebrate with special festival discounts" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {festivalOffers.map(renderOfferCard)}
          </div>
        </section>
      )}

      {offers.length === 0 && (
        <EmptyState icon="🏷️" title="No offers available" description="Check back later for new deals and discounts" />
      )}
    </div>
  );
}
