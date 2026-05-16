'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(1, page - delta);
      i <= Math.min(totalPages, page + delta);
      i++
    ) {
      range.push(i);
    }

    const rangeWithDots: (number | string)[] = [];
    let left = 1;

    for (const item of range) {
      if (item - left === 2) {
        rangeWithDots.push(left + 1);
      } else if (item - left !== 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(item);
      left = item;
    }

    if (range[0] > 1) {
      rangeWithDots.unshift(1);
      if (range[0] > 2) rangeWithDots.splice(1, 0, '...');
    }

    if (range[range.length - 1] < totalPages) {
      if (range[range.length - 1] < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((pageNum, index) => (
          <span key={index}>
            {pageNum === '...' ? (
              <span className="px-2 py-1 text-sm text-gray-400">...</span>
            ) : (
              <Button
                variant={pageNum === page ? 'default' : 'outline'}
                size="icon-sm"
                onClick={() => onPageChange(pageNum as number)}
                className="w-8"
              >
                {pageNum}
              </Button>
            )}
          </span>
        ))}

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
