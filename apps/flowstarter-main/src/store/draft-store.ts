'use client';

import { create } from 'zustand';

export interface DraftShape {
  id?: string | null;
  updated_at?: string | null;
  chat?: string | null;
  template_id?: string | null;
  entry_mode?: 'ai' | 'manual' | null;
  current_step?: 'details' | 'template' | 'design' | 'review' | null;
}

interface DraftStoreState {
  draft: DraftShape | null;
  hasLoadedOnce: boolean;
  setDraft: (d: DraftShape | null) => void;
  setEntryMode: (mode: 'ai' | 'manual') => void;
  markLoaded: () => void;
  reset: () => void;
}

export const useDraftStore = create<DraftStoreState>((set) => ({
  draft: null,
  hasLoadedOnce: false,
  setDraft: (d) => set({ draft: d }),
  setEntryMode: (mode) =>
    set((prev) => ({ draft: { ...(prev.draft || {}), entry_mode: mode } })),
  markLoaded: () => set({ hasLoadedOnce: true }),
  reset: () => set({ draft: null, hasLoadedOnce: false }),
}));
