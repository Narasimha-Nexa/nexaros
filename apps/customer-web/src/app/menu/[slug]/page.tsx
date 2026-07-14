'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Flame, Heart, Share2, Check, Plus } from 'lucide-react';
import { Button, Card, Badge, VegIndicator, RatingStars, PriceDisplay, QuantitySelector, SectionHeader } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart-store';
import { useUIStore } from '@/lib/store/ui-store';
import { api } from '@/lib/api';
import type { MenuItem, AddOn } from '@/types';

export default function MenuItemPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [instructions, setInstructions] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const { addItem } = useCartStore();
  const { openCart } = useUIStore();

  useEffect(() => {
    api.getMenuItem(slug).then((data) => {
      if (!data) { setLoading(false); return; }
      setItem(data);
      setSelectedVariant(data.variants[0]?.id || null);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-hairline rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-hairline rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-hairline rounded w-3/4" />
              <div className="h-4 bg-hairline rounded w-full" />
              <div className="h-4 bg-hairline rounded w-1/2" />
              <div className="h-20 bg-hairline rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return notFound();

  const variantPrice = item.variants.find((v) => v.id === selectedVariant)?.price || item.price;
  const addOnsPrice = item.addOns.filter((ao) => selectedAddOns.includes(ao.id)).reduce((s, ao) => s + ao.price, 0);
  const totalPrice = (variantPrice + addOnsPrice) * quantity;

  const handleAddToCart = () => {
    addItem(
      item,
      quantity,
      item.variants.find((v) => v.id === selectedVariant),
      item.addOns.filter((ao) => selectedAddOns.includes(ao.id)),
      instructions
    );
    openCart();
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  const allImages = item.images.length > 0 ? [item.image, ...item.images] : [item.image];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-body mb-6">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span>/</span>
        <Link href="/menu" className="hover:text-ink transition-colors">Menu</Link>
        <span>/</span>
        <span className="text-ink font-medium">{item.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-hairline">
            <Image
              src={allImages[activeImage]}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <div className="absolute top-3 left-3 flex gap-1.5">
              {item.isBestSeller && <Badge variant="primary">Bestseller</Badge>}
              {item.isNew && <Badge variant="success">New</Badge>}
              {item.isSpicy && <Badge variant="warning">Spicy</Badge>}
            </div>
            <div className="absolute top-3 right-3 flex gap-1.5">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn('w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-white', isFavorite && 'text-red-500')}
                aria-label="Toggle favorite"
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors" aria-label="Share">
                <Share2 size={18} />
              </button>
            </div>
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all relative',
                    activeImage === i ? 'border-ink' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <VegIndicator isVeg={item.isVeg} />
            <span className="text-xs text-body">{item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-ink mb-2">{item.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <RatingStars rating={item.rating} size="md" />
            <span className="text-sm text-body">({item.reviewCount} reviews)</span>
          </div>
          <p className="text-body leading-relaxed mb-6">{item.description}</p>

          {/* Prep time & Calories */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-1.5 text-sm text-body">
              <Clock size={16} />
              <span>{item.prepTime} mins</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-body">
              <Flame size={16} />
              <span>{item.nutrition.calories} cal</span>
            </div>
          </div>

          {/* Variants */}
          {item.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-ink mb-2">Select Size</h3>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={cn(
                      'px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                      selectedVariant === v.id
                        ? 'border-ink bg-ink text-white'
                        : 'border-hairline text-body hover:border-ink/30'
                    )}
                  >
                    {v.name} · {formatPrice(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.addOns.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-ink mb-2">Add Extras</h3>
              <div className="grid grid-cols-2 gap-2">
                {item.addOns.map((ao) => (
                  <button
                    key={ao.id}
                    onClick={() => toggleAddOn(ao.id)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all',
                      selectedAddOns.includes(ao.id)
                        ? 'border-ink bg-ink/5 text-ink'
                        : 'border-hairline text-body hover:border-ink/30'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('w-4 h-4 rounded border flex items-center justify-center', selectedAddOns.includes(ao.id) ? 'bg-ink border-ink text-white' : 'border-hairline')}>
                        {selectedAddOns.includes(ao.id) && <Check size={10} />}
                      </span>
                      <span>{ao.name}</span>
                    </div>
                    <span className="text-xs">+{formatPrice(ao.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="border-t border-hairline pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <PriceDisplay price={totalPrice} size="lg" />
              <QuantitySelector quantity={quantity} onIncrease={() => setQuantity((q) => q + 1)} onDecrease={() => setQuantity((q) => Math.max(1, q - 1))} min={1} />
            </div>
            <textarea
              placeholder="Any special instructions? (e.g., less spicy, extra cheese...)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-hairline text-sm text-ink placeholder:text-body/40 focus:outline-none focus:border-ink/30 resize-none"
            />
            <Button onClick={handleAddToCart} className="w-full h-12 text-base gap-2">
              <Plus size={20} />
              Add to Cart · {formatPrice(totalPrice)}
            </Button>
          </div>

          {/* Nutrition */}
          <div className="mt-8 p-5 rounded-2xl bg-hairline/50">
            <h3 className="font-semibold text-ink text-sm mb-3">Nutrition Information</h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { label: 'Calories', value: item.nutrition.calories },
                { label: 'Protein', value: item.nutrition.protein },
                { label: 'Carbs', value: item.nutrition.carbs },
                { label: 'Fat', value: item.nutrition.fat },
                { label: 'Fiber', value: item.nutrition.fiber },
              ].map((n) => (
                <div key={n.label} className="p-2 bg-white dark:bg-ink rounded-lg">
                  <div className="font-bold text-ink">{n.value}</div>
                  <div className="text-body mt-0.5">{n.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="mt-6">
            <h3 className="font-semibold text-ink text-sm mb-2">Ingredients</h3>
            <div className="flex flex-wrap gap-1.5">
              {item.ingredients.map((ing) => (
                <span key={ing} className="px-2.5 py-1 rounded-full bg-hairline text-xs text-body">{ing}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
