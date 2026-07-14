'use client';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('skeleton rounded', className)} />
      ))}
    </>
  );
}

export function StatSkeleton() {
  return (
    <div className="card p-6">
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-10 w-32 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card">
      <div className="p-4 border-b border-hairline">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="divide-y divide-hairline">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="flex-1 h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-6">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-20 w-full mb-4" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}
