import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Crumb {
  label: string;
  href?: string;
}

interface UiState {
  /** Project picked in the top bar; the default for "Nuevo registro". */
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  /** Mobile navigation drawer. */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  /** "Nuevo registro de campo" dialog, opened from the top bar or any page. */
  newRecordOpen: boolean;
  setNewRecordOpen: (open: boolean) => void;
  /** Breadcrumbs of the current page (set with `useBreadcrumbs`). */
  crumbs: Crumb[];
  setCrumbs: (crumbs: Crumb[]) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      currentProjectId: '',
      setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
      drawerOpen: false,
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
      newRecordOpen: false,
      setNewRecordOpen: (newRecordOpen) => set({ newRecordOpen }),
      crumbs: [],
      setCrumbs: (crumbs) => set({ crumbs }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      partialize: (state) => ({ currentProjectId: state.currentProjectId }),
    }
  )
);
