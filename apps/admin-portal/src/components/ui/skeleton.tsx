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
        <div key={i} className={cn('skeleton min-h-[1em]', className)} />
      ))}
    </>
  );
}

export function StatSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-[11px] w-24 mb-4" />
      <Skeleton className="h-9 w-32 mb-2" />
      <Skeleton className="h-[11px] w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-hairline bg-canvas-soft">
        <Skeleton className="h-[11px] w-48" />
      </div>
      <div className="divide-y divide-hairline">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="flex-1 h-[14px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-[14px] w-32 mb-4" />
      <Skeleton className="h-20 w-full mb-4" />
      <Skeleton className="h-[11px] w-48" />
    </div>
  );
}
