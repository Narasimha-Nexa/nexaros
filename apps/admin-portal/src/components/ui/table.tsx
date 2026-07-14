'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  keyExtractor?: (row: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, onRowClick, isLoading, emptyMessage = 'No data found', keyExtractor
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="divide-y divide-hairline">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4">
              {columns.map((col) => (
                <div key={col.key} className="flex-1">
                  <div className="skeleton h-4 w-full rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn(col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-body font-sans">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={keyExtractor ? keyExtractor(row) : idx}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn(col.className)}>
                    {col.render ? col.render(row[col.key], row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
}

export function Pagination({ page, totalPages, onPageChange, total, pageSize }: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-4 font-sans">
      <p className="text-body-sm text-body">
        {total !== undefined && `Showing ${(page - 1) * (pageSize || 10) + 1}–${Math.min(page * (pageSize || 10), total)} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <button className="btn-ghost btn-sm p-2" onClick={() => onPageChange(1)} disabled={page === 1}>
          <ChevronsLeft size={14} />
        </button>
        <button className="btn-ghost btn-sm p-2" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          if (p > totalPages) return null;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn('btn-sm px-3 py-1', p === page ? 'btn-primary' : 'btn-ghost')}
            >
              {p}
            </button>
          );
        })}
        <button className="btn-ghost btn-sm p-2" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
          <ChevronRight size={14} />
        </button>
        <button className="btn-ghost btn-sm p-2" onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
