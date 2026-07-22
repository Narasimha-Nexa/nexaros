'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CalendarDays, Clock, User, Tag, ChevronLeft } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import DOMPurify from 'isomorphic-dompurify';
import { cn, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import type { BlogPost } from '@/types';

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlogPost(slug).then((data) => {
      setPost(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-24 bg-hairline rounded" />
          <div className="h-64 bg-hairline rounded-2xl" />
          <div className="h-10 bg-hairline rounded w-3/4" />
          <div className="h-4 bg-hairline rounded w-full" />
          <div className="h-4 bg-hairline rounded w-full" />
          <div className="h-4 bg-hairline rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!post) return notFound();

  const renderContent = (content: string) => {
    const sanitized = DOMPurify.sanitize(content, { ALLOWED_TAGS: ['h2', 'h3', 'h4', 'p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'img', 'blockquote', 'pre', 'code'], ALLOWED_ATTR: ['href', 'src', 'alt', 'className'] });
    return sanitized.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold text-ink mt-8 mb-3">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold text-ink mt-6 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-body leading-relaxed mb-3">{line}</p>;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-body hover:text-ink transition-colors mb-6">
        <ChevronLeft size={16} /> Back to Blog
      </Link>

      <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden mb-8 bg-hairline">
        <Image src={post.image} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority />
        <div className="absolute inset-0 gradient-overlay" />
        <div className="absolute bottom-4 left-4">
          <Badge variant="warning">{post.category}</Badge>
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-ink mb-4">{post.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm text-body mb-8 pb-6 border-b border-hairline">
        <span className="flex items-center gap-1.5"><CalendarDays size={16} />{formatDate(post.publishedAt)}</span>
        <span className="flex items-center gap-1.5"><Clock size={16} />{post.readTime} min read</span>
        <span className="flex items-center gap-1.5"><User size={16} />{post.author}</span>
      </div>

      <article className="prose prose-sm max-w-none">
        {renderContent(post.content)}
      </article>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-hairline">
          <Tag size={16} className="text-body mt-0.5" />
          {post.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-hairline text-xs text-body">{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/blog">
          <Button variant="outline"><ArrowLeft size={16} /> More Posts</Button>
        </Link>
      </div>
    </div>
  );
}
