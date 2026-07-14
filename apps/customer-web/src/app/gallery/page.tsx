'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Play } from 'lucide-react';
import { Button, Badge, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { GalleryImage } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'interior', label: 'Interior' },
  { id: 'food', label: 'Food' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'events', label: 'Events' },
  { id: 'exterior', label: 'Exterior' },
];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    api.getGalleryImages().then((data) => {
      setImages(data);
      setLoading(false);
    });
  }, []);

  const filteredImages = activeCategory === 'all' ? images : images.filter((img) => img.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Gallery</h1>
        <p className="text-body">A visual journey through Spice Garden</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
              activeCategory === cat.id ? 'bg-ink text-white border-ink' : 'bg-white text-body border-hairline hover:text-ink'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-hairline rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredImages.length === 0 ? (
        <EmptyState icon="📷" title="No images found" description="No images in this category yet" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setLightboxIndex(images.indexOf(img))}
              className="group relative aspect-square rounded-xl overflow-hidden bg-hairline"
            >
              <Image src={img.thumbnail} alt={img.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                {img.isVideo && (
                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                    <Play className="w-5 h-5 text-ink ml-0.5" fill="currentColor" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors" onClick={() => setLightboxIndex(null)} aria-label="Close">
            <X size={28} />
          </button>
          <div className="max-w-4xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full max-h-[75vh]">
              <Image src={images[lightboxIndex]?.url} alt={images[lightboxIndex]?.title} fill className="object-contain" sizes="(max-width: 768px) 100vw, 800px" />
            </div>
            <div className="text-white text-center mt-3">
              <p className="font-medium">{images[lightboxIndex]?.title}</p>
              <p className="text-sm text-white/60">{images[lightboxIndex]?.description}</p>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            <button onClick={() => setLightboxIndex((lightboxIndex - 1 + filteredImages.length) % filteredImages.length)} className="text-white/80 hover:text-white transition-colors" aria-label="Previous">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-white/60 text-sm self-center">{lightboxIndex + 1} / {filteredImages.length}</span>
            <button onClick={() => setLightboxIndex((lightboxIndex + 1) % filteredImages.length)} className="text-white/80 hover:text-white transition-colors" aria-label="Next">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
