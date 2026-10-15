import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { PaginatedResult } from './api-response.js';

export const MAX_PAGE_SIZE = 100;

/** `?page=1&limit=20&q=…` (docs/api/conventions.md#lists). Extend it per endpoint. */
export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 20;

  /** Free-text search; each endpoint documents which fields it matches. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export function skipTake(query: { page: number; limit: number }): { skip: number; take: number } {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}

export function paginated<T>(
  data: T[],
  total: number,
  query: { page: number; limit: number },
): PaginatedResult<T> {
  return {
    data,
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

/** Trimmed search text, or undefined when empty. */
export function searchTerm(q: string | undefined): string | undefined {
  const term = q?.trim();
  return term ? term : undefined;
}
