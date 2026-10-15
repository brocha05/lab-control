'use client';

import { useState } from 'react';
import { useDebounce } from './useDebounce';

/** Page + debounced search for list screens. Changing the search goes back to page 1. */
export function useListState(limit = 20) {
  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState('');
  const q = useDebounce(search.trim(), 300);

  const setSearch = (value: string) => {
    setSearchValue(value);
    setPage(1);
  };

  return { page, setPage, search, setSearch, params: { page, limit, q: q || undefined } };
}
