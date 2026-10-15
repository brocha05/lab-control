import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ListQueryDto, paginated, searchTerm, skipTake } from './pagination.js';

function parse(raw: Record<string, string | undefined>) {
  const dto = plainToInstance(ListQueryDto, raw);
  return { dto, errors: validateSync(dto) };
}

describe('pagination', () => {
  it('defaults to page 1, 20 per page', () => {
    const { dto, errors } = parse({});
    expect(errors).toHaveLength(0);
    expect(skipTake(dto)).toEqual({ skip: 0, take: 20 });
  });

  it('parses numbers from the query string', () => {
    const { dto, errors } = parse({ page: '3', limit: '10' });
    expect(errors).toHaveLength(0);
    expect(skipTake(dto)).toEqual({ skip: 20, take: 10 });
  });

  it.each([{ page: '0' }, { limit: '101' }, { limit: 'abc' }, { page: '1.5' }])(
    'rejects %o',
    (raw) => {
      expect(parse(raw).errors.length).toBeGreaterThan(0);
    },
  );

  it('computes the page count, with at least one page', () => {
    expect(paginated([1, 2], 41, { page: 1, limit: 20 }).pages).toBe(3);
    expect(paginated([], 0, { page: 1, limit: 20 }).pages).toBe(1);
  });

  it('normalizes the search term', () => {
    expect(searchTerm('  cemex ')).toBe('cemex');
    expect(searchTerm('   ')).toBeUndefined();
    expect(searchTerm(undefined)).toBeUndefined();
  });
});
