'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Clock, MapPin, Users, Music, UtensilsCrossed, GraduationCap, Sparkles, ArrowRight } from 'lucide-react';
import { Button, Card, Badge, SectionHeader, EmptyState } from '@/components/ui';
import { cn, formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Event } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'All Events', icon: Sparkles },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'workshop', label: 'Workshops', icon: GraduationCap },
  { id: 'special', label: 'Special', icon: Sparkles },
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    api.getEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const filtered = activeCategory === 'all' ? events : events.filter((e) => e.category === activeCategory);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-hairline rounded w-48" />
          <div className="h-5 bg-hairline rounded w-72" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-80 bg-hairline rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Events & Experiences</h1>
        <p className="text-body">Join us for unforgettable moments at Spice Garden</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border flex items-center gap-1.5',
              activeCategory === cat.id ? 'bg-ink text-white border-ink' : 'bg-white text-body border-hairline hover:text-ink'
            )}
          >
            <cat.icon size={16} /> {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🎪" title="No events found" description="Check back later for upcoming events" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <Card key={event.id} variant="elevated" className="overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <Image src={event.image} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, 33vw" />
                <div className="absolute inset-0 gradient-overlay" />
                <div className="absolute top-3 left-3">
                  <Badge variant={event.isFeatured ? 'warning' : 'primary'}>
                    {event.isFeatured ? '⭐ Featured' : event.category}
                  </Badge>
                </div>
                {!event.isFree && event.price && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="danger">{formatPrice(event.price)}</Badge>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg">{event.title}</h3>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-body">
                  <CalendarDays size={16} />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-body">
                  <Clock size={16} />
                  <span>{event.time} - {event.endTime}</span>
                </div>
                {event.capacity > 0 && (
                  <div className="flex items-center gap-2 text-sm text-body">
                    <Users size={16} />
                    <span>{event.registeredCount}/{event.capacity} registered</span>
                  </div>
                )}
                <p className="text-sm text-body line-clamp-2">{event.description}</p>
                <div className="pt-2">
                  <Link href={`/events/${event.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More <ArrowRight size={14} />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
