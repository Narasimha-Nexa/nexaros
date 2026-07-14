'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Clock, ArrowRight, User } from 'lucide-react';
import { Button, Card, Badge, SectionHeader, EmptyState } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import type { BlogPost } from '@/types';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlogPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-hairline rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-hairline rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const featuredPosts = posts.filter((p) => p.featured);
  const recentPosts = posts.filter((p) => !p.featured);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-2">Our Blog</h1>
        <p className="text-body">Stories, recipes, and updates from Spice Garden</p>
      </div>

      {featuredPosts.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-ink mb-4">Featured Stories</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <Card className="overflow-hidden p-0 hover:shadow-lg transition-all duration-300">
                  <div className="relative h-56 overflow-hidden">
                    <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
                    <div className="absolute inset-0 gradient-overlay" />
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="warning">{post.category}</Badge>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-ink text-lg mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-body text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-body">
                      <span className="flex items-center gap-1"><CalendarDays size={14} />{formatDate(post.publishedAt)}</span>
                      <span className="flex items-center gap-1"><Clock size={14} />{post.readTime} min read</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Latest Posts" />
        {recentPosts.length === 0 && featuredPosts.length === 0 ? (
          <EmptyState icon="📝" title="No posts yet" description="Check back soon for new stories" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[...featuredPosts.slice(2), ...recentPosts].map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <Card className="p-0 overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-40 h-40 shrink-0 overflow-hidden">
                      <div className="relative w-full h-full">
                      <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="160px" />
                      </div>
                    </div>
                    <div className="p-4 flex-1 min-w-0">
                      <Badge variant="default" className="mb-2">{post.category}</Badge>
                      <h3 className="font-semibold text-ink text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                      <p className="text-xs text-body line-clamp-1 mb-2">{post.excerpt}</p>
                      <div className="flex items-center gap-3 text-xs text-body">
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>{post.readTime} min read</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
