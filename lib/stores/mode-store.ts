'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ModeState = {
  isLiveMode: boolean;
  toggleMode: () => void;
};

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      isLiveMode: false,
      toggleMode: () => set((state) => ({ isLiveMode: !state.isLiveMode })),
    }),
    {
      name: 'mode-storage',
    }
  )
);
