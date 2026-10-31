import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme, UserPreferences } from '@shared/types';

type AppStore = {
  theme: Theme;
  userPreferences: UserPreferences;
  setTheme: (theme: Theme) => void;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
};

const defaultPreferences: UserPreferences = {
  theme: 'light',
  fontSize: 'medium',
  timerVisible: true,
  soundEnabled: false,
  keyboardShortcuts: true,
};

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'light',
      userPreferences: defaultPreferences,
      setTheme: (theme) => set({ theme }),
      setUserPreferences: (prefs) =>
        set((state) => ({ userPreferences: { ...state.userPreferences, ...prefs } })),
    }),
    {
      name: 'examdesk-app-prefs',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppStore>;
        return {
          ...current,
          ...p,
          userPreferences: { ...defaultPreferences, ...(p.userPreferences ?? {}) },
        };
      },
    }
  )
);
