'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Award, Star, Users, Heart, Quote } from 'lucide-react';
import { Button, Card, Badge, SectionHeader } from '@/components/ui';
import { TENANT_INFO, TEAM_MEMBERS, TESTIMONIALS } from '@/lib/data/mock-data';

export default function AboutPage() {
  return (
    <div className="space-y-0">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <Image src={TENANT_INFO.coverImage} alt="" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        <div className="relative z-10 text-center px-4">
          <Badge variant="warning" className="mb-4">Our Story</Badge>
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-3">{TENANT_INFO.name}</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">{TENANT_INFO.tagline}</p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink mb-6">Our Story</h2>
            <div className="space-y-4 text-body leading-relaxed">
              <p>Founded in 2012, Spice Garden began with a simple vision: to bring the authentic flavors of India to Bengaluru&apos;s vibrant dining scene. What started as a small family-run kitchen has grown into one of the city&apos;s most beloved restaurants.</p>
              <p>Our culinary philosophy is rooted in tradition but open to innovation. We source the finest ingredients from local farmers and global markets, and our chefs transform them into dishes that honor India&apos;s rich culinary heritage while embracing modern techniques.</p>
              <p>Every dish at Spice Garden tells a story — of generations of family recipes, of regions and traditions, of our commitment to excellence. We invite you to be part of our story.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative rounded-2xl overflow-hidden w-full h-64 sm:h-80">
              <Image src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=800&fit=crop" alt="Restaurant facade" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="relative rounded-2xl overflow-hidden w-full h-64 sm:h-80 mt-8">
              <Image src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=800&fit=crop" alt="Dining interior" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-hairline/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '12+', label: 'Years of Excellence' },
              { value: '15K+', label: 'Happy Customers' },
              { value: '200+', label: 'Signature Dishes' },
              { value: '4.7★', label: 'Average Rating' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-ink mb-1">{stat.value}</div>
                <div className="text-sm text-body">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <SectionHeader title="Awards & Recognition" subtitle="Our commitment to excellence has been recognized" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TENANT_INFO.awards.map((award) => (
            <Card key={award.title} variant="elevated" className="text-center p-6">
              <Award className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-ink mb-1">{award.title}</h3>
              <p className="text-sm text-body">{award.year} · {award.organization}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-hairline/30 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeader title="Meet Our Team" subtitle="The passionate people behind Spice Garden" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <Card key={member.id} variant="elevated" className="text-center p-6">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 bg-hairline relative">
                  <Image src={member.image} alt={member.name} fill className="object-cover" sizes="96px" />
                </div>
                <h3 className="font-semibold text-ink">{member.name}</h3>
                <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                <p className="text-xs text-body">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <SectionHeader title="Why Dine With Us" subtitle="We go the extra mile for every guest" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {TENANT_INFO.features.map((feature) => (
            <Card key={feature} variant="elevated" className="text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-2">
                <Heart className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm font-medium text-ink">{feature}</span>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
