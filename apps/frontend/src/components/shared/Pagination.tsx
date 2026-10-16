'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pages, total, onPageChange }: PaginationProps) {
  if (pages <= 1) {
    return (
      <p className="text-[13px] text-subtle">
        {total} {total === 1 ? 'registro' : 'registros'}
      </p>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[13px] text-subtle">
        Página {page} de {pages} · {total} registros
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
        >
          Siguiente
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
